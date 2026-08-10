/**
 * index.ts  —  TalentForge Grading Worker
 *
 * Lifecycle per job:
 *   1. Precheck candidate code against security blocklist (precheck.ts).
 *   2. Fetch student code from S3/MinIO.
 *   3. Fetch all test cases (public + hidden) from backend internal API.
 *   4. Run the code in a Docker sandbox with each test case piped through stdin.
 *   5. Grade correctness: weighted pass rate across all cases.
 *   6. Grade complexity: curve-fit execution times vs input size (n, 2n, 4n scaling).
 *   7. Grade style: parse linter output for violations (pylint, eslint, checkstyle).
 *   8. Compute composite score: 60% correctness + 30% complexity + 10% style.
 *   9. Patch the Submission row via internal API.
 *  10. Emit grading:complete over Socket.IO so the frontend updates in real-time.
 */

import 'dotenv/config';
import { Worker, Job, UnrecoverableError, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Emitter } from '@socket.io/redis-emitter';
import { runCodeInSandbox }   from './grader/sandbox';
import { gradeCorrectness, TestCase } from './grader/correctness';
import { gradeComplexity }    from './grader/complexity';
import { gradeStyle }         from './grader/style';
import { precheckCode }       from './grader/precheck';

// Sentry Worker Observability Setup
if (process.env.SENTRY_DSN) {
  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
    });
  } catch (err: any) {
    console.warn('[Worker] Sentry initialization failed (likely npm version mismatch), skipping observability:', err.message);
  }
}

// Custom Unretryable User Error Class
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GradeJobData {
  submissionId: string;
  userId:       string;
  problemId:    string;
  s3Key:        string;
  language:     string;
}

interface ProblemCasesResponse {
  problemId:       string;
  slug:            string;
  title:           string;
  publicTestCases: TestCase[];
  hiddenTestCases: TestCase[];
}

// ─── Redis / Socket.IO emitter ────────────────────────────────────────────────

const redisUrl = process.env.REDIS_URL ?? 'redis://:redis_dev_secret@127.0.0.1:6380';

function isTransientSocketError(err: any): boolean {
  if (!err) return false;
  const code = err.code || '';
  const msg = err.message || '';
  return (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNABORTED' ||
    code === 'ECONNRESET' ||
    msg.includes('ECONNABORTED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ECONNREFUSED')
  );
}

export function createRedisConnection() {
  const conn = new IORedis(redisUrl, {
    family:               4, // Strictly use IPv4 loopback (bypasses Windows dual-stack IPv6 socket aborts)
    maxRetriesPerRequest: null,
    enableOfflineQueue:   true,
    keepAlive:            10000,
    retryStrategy: (times) => Math.min(times * 200, 3000),
  });


  conn.on('error', (err: any) => {
    if (isTransientSocketError(err)) return;
    console.error('[Worker] Redis connection error:', err.message);
  });

  return conn;
}

const connection = createRedisConnection();
const emitter = new Emitter(connection);


// ─── Helpers ──────────────────────────────────────────────────────────────────

function emitGradingEvent(
  event:        string,
  submissionId: string,
  payload:      Record<string, unknown>,
) {
  emitter.to(`submission:${submissionId}`).emit(event, { submissionId, ...payload });
}

/**
 * Fetch the student's code string from S3/MinIO.
 * Falls back to a language-appropriate stub when the object store is unreachable.
 */
async function fetchCode(s3Key: string, language: string): Promise<string> {
  const minioUrl = process.env.MINIO_INTERNAL_URL;
  const bucket   = process.env.MINIO_BUCKET ?? 'talentforge';

  if (minioUrl) {
    try {
      const res = await fetch(`${minioUrl}/${bucket}/${s3Key}`);
      if (res.ok) {
        return await res.text();
      }
      console.warn(`[Worker] MinIO fetch failed for ${s3Key}: ${res.status}`);
    } catch (err: any) {
      console.warn(`[Worker] MinIO unreachable, falling back to stub: ${err.message}`);
    }
  }

  // Dev fallback stubs
  if (language === 'python')               return '# stub\nprint("0 1")';
  if (language === 'javascript' || language === 'node') return '// stub\nconsole.log("0 1");';
  if (language === 'java')
    return 'public class Solution { public static void main(String[] a) { System.out.println("0 1"); } }';
  return '';
}

let prismaClient: any = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prismaClient = new PrismaClient();
} catch (e) {
  // Optional Prisma client fallback
}

/**
 * Helper to fetch internal backend APIs with fallback across candidate ports/hosts.
 */
async function fetchWithFallback(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const primaryUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:5001';
  const candidateUrls = Array.from(new Set([
    primaryUrl,
    'http://127.0.0.1:5001',
    'http://localhost:5001',
    'http://127.0.0.1:5002',
    'http://localhost:5002',
  ])).filter(Boolean);

  let lastError: Error | null = null;
  for (const baseUrl of candidateUrls) {
    try {
      const fullUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
      const res = await fetch(fullUrl, options);
      if (res.ok) return res;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error(`Backend internal API unreachable: ${lastError?.message || 'fetch failed'}`);
}

/**
 * Fetch all test cases for a problem from the backend internal API or direct DB fallback.
 */
async function fetchTestCases(
  backendUrl: string,
  problemId:  string,
  secret:     string,
): Promise<ProblemCasesResponse> {
  try {
    const res = await fetchWithFallback(`/internal/problems/${problemId}/cases`, {
      headers: { 'x-internal-secret': secret },
    });

    return await (res.json() as Promise<ProblemCasesResponse>);
  } catch (err: any) {
    if (prismaClient) {
      try {
        const problem = await prismaClient.problem.findUnique({
          where: { id: problemId },
          select: { id: true, slug: true, title: true, publicTestCases: true, hiddenTestCases: true },
        });
        if (problem) {
          console.log(`[Worker] Direct DB fallback fetched test cases for problem ${problemId}`);
          return {
            problemId: problem.id,
            slug: problem.slug,
            title: problem.title,
            publicTestCases:  (problem.publicTestCases  as any) ?? [],
            hiddenTestCases:  (problem.hiddenTestCases  as any) ?? [],
          };
        }
      } catch (dbErr: any) {
        console.warn('[Worker] Direct DB fallback failed:', dbErr.message);
      }
    }
    // If backend is unreachable, throw an infrastructure error to trigger retry
    throw new Error(`InfraError: Backend internal API unreachable: ${err.message}`);
  }
}

/**
 * Extract the expected complexity string from problem title / metadata.
 */
function resolveExpectedComplexity(slug: string): string {
  const table: Record<string, string> = {
    'two-sum':      'O(n)',
    'lru-cache':    'O(1)',
    'rate-limiter': 'O(1)',
  };
  return table[slug] ?? 'O(n)';
}

// ─── Core grader ──────────────────────────────────────────────────────────────

async function runGrader(
  job: Job<GradeJobData>,
): Promise<{
  correctness: number;
  complexity:  number;
  style:       number;
  total:       number;
  feedback:    object;
}> {
  const { submissionId, problemId, s3Key, language } = job.data;

  const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:5001';
  const secret     = process.env.INTERNAL_SECRET      ?? 'tf-internal';

  // 1. Mark as running
  emitGradingEvent('grading:running', submissionId, { s3Key, language });

  // 2. Fetch candidate code + test cases in parallel
  const [code, casesResponse] = await Promise.all([
    fetchCode(s3Key, language),
    fetchTestCases(backendUrl, problemId, secret),
  ]);

  // 3. Security Precheck Blocklist Scanner
  const precheck = precheckCode(code, language);
  if (!precheck.allowed) {
    console.warn(`[Worker] Precheck BLOCKED submission ${submissionId}: ${precheck.reason}`);
    throw new UserError(`BLOCKED: ${precheck.reason}`);
  }

  const publicCases: TestCase[] = casesResponse.publicTestCases  ?? [];
  const hiddenCases: TestCase[] = casesResponse.hiddenTestCases  ?? [];
  const allCases:    TestCase[] = [...publicCases, ...hiddenCases];
  const hiddenStart              = publicCases.length;

  console.log(
    `[Worker] Grading submission ${submissionId}: ${allCases.length} cases ` +
    `(${publicCases.length} public, ${hiddenCases.length} hidden) — lang: ${language}`,
  );

  if (allCases.length === 0) {
    console.warn(`[Worker] No test cases found for problem ${problemId}; skipping grading.`);
    return { correctness: 0, complexity: 0, style: 0, total: 0, feedback: { warning: 'No test cases found.' } };
  }

  // 4. Run Docker sandbox
  const sandboxResult = await runCodeInSandbox(submissionId, language, code, allCases);

  // ── Handle candidate execution failures (User Errors fail fast, no retry) ──────
  if (sandboxResult.status === 'timeout') {
    throw new UserError('TIMEOUT');
  }
  if (sandboxResult.status === 'oom') {
    throw new UserError('OOM');
  }
  if (sandboxResult.status === 'compile_error') {
    throw new UserError(`COMPILE_ERROR: ${sandboxResult.stderr ?? ''}`);
  }
  if (sandboxResult.status === 'error') {
    throw new UserError(sandboxResult.stderr ?? 'Execution Error');
  }

  // 5. Grade correctness
  const correctnessResult = gradeCorrectness(
    allCases,
    sandboxResult.actualOutputs,
    sandboxResult.elapsedTimes,
    hiddenStart,
  );

  // 6. Grade complexity (n, 2n, 4n scaling curve-fitting)
  const expectedComplexity = resolveExpectedComplexity(casesResponse.slug);
  const complexityResult   = gradeComplexity(
    expectedComplexity,
    sandboxResult.elapsedTimes,
    sandboxResult.stdinSizes,
  );

  // 7. Grade style (pylint, eslint, checkstyle in-container output)
  const styleResult = gradeStyle(sandboxResult.styleRaw, language);

  // 8. Composite score: 60% correctness + 30% complexity + 10% style
  const total = Math.round(
    0.60 * correctnessResult.score +
    0.30 * complexityResult.score  +
    0.10 * styleResult.score,
  );

  console.log(
    `[Worker] Scores — correctness:${correctnessResult.score} ` +
    `complexity:${complexityResult.score} style:${styleResult.score} ` +
    `→ total:${total}`,
  );

  return {
    correctness: correctnessResult.score,
    complexity:  complexityResult.score,
    style:       styleResult.score,
    total,
    feedback: {
      correctness: {
        score:       correctnessResult.score,
        passedCount: correctnessResult.passedCount,
        totalCount:  correctnessResult.totalCount,
        cases:       correctnessResult.cases,
      },
      complexity: {
        score:       complexityResult.score,
        estimated:   complexityResult.estimated,
        expected:    complexityResult.expected,
        confidence:  complexityResult.confidence,
        timeSamples: complexityResult.timeSamples,
      },
      style: {
        score:      styleResult.score,
        violations: styleResult.violations,
      },
    },
  };
}

// ─── BullMQ Worker Config ─────────────────────────────────────────────────────

const worker = new Worker<GradeJobData>(
  'grading',
  async (job) => {
    const { submissionId, language } = job.data;
    console.log(`[Worker] Picked up job ${job.id} — submission ${submissionId} (${language})`);

    emitGradingEvent('grading:queued', submissionId, { jobId: job.id });

    try {
      const scores = await runGrader(job);

      // Patch Submission row in DB via backend internal API with fallback
      const secret = process.env.INTERNAL_SECRET ?? 'tf-internal';

      let patchRes: Response | null = null;
      try {
        patchRes = await fetchWithFallback(`/internal/submissions/${submissionId}`, {
          method:  'PATCH',
          headers: {
            'Content-Type':     'application/json',
            'x-internal-secret': secret,
          },
          body: JSON.stringify({
            status:   'completed',
            score:    scores.total,
            feedback: JSON.stringify(scores.feedback),
          }),
        });
      } catch (err: any) {
        console.warn(`[Worker] HTTP patch failed for submission ${submissionId}, using DB fallback:`, err.message);
        if (prismaClient) {
          try {
            await prismaClient.submission.update({
              where: { id: submissionId },
              data: {
                status:   'completed',
                score:    scores.total,
                feedback: JSON.stringify(scores.feedback),
              },
            });
            console.log(`[Worker] Direct DB fallback successfully updated submission ${submissionId}`);
          } catch (dbErr: any) {
            console.error('[Worker] Direct DB fallback update failed:', dbErr.message);
          }
        }
      }

      let awardedBadgeId = undefined;
      if (patchRes && !patchRes.ok) {
        console.warn(`[Worker] Failed to patch submission ${submissionId}:`, await patchRes.text());
      } else if (patchRes) {
        try {
          const patchData = await patchRes.json();
          if (patchData.badge) {
            awardedBadgeId = patchData.badge.verifyId;
          }
        } catch (e) {
          console.error(`[Worker] Failed to parse patch response:`, e);
        }
      }

      // Emit completion event — frontend listens for this to render score cards
      emitGradingEvent('grading:complete', submissionId, {
        scores: {
          correctness: scores.correctness,
          complexity:  scores.complexity,
          style:       scores.style,
          total:       scores.total,
        },
        feedback: scores.feedback,
        status: 'completed',
        badgeId: awardedBadgeId,
      });

      console.log(`[Worker] Job ${job.id} done. Total score: ${scores.total}`);
      return scores;
    } catch (err: any) {
      if (err instanceof UserError || err.name === 'UserError') {
        // Candidate user error: Unrecoverable, fail fast with 0 retries
        throw new UnrecoverableError(err.message);
      }
      // Infrastructure error: BullMQ will retry up to 2 attempts
      throw err;
    }
  },
  {
    connection:      createRedisConnection() as any,
    concurrency:     4,
    stalledInterval: 15_000, // Tuned stalled interval (15s)
    maxStalledCount: 2,
  },
);

// ─── Profile Embedding Queue ─────────────────────────────────────────────────
const profileQueue = new Queue('profile-embedding', { connection: createRedisConnection() as any });
const profileWorker = new Worker(
  'profile-embedding',
  async (job) => {
    if (job.name === 'nightly-embed') {
      const backendUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:5001';
      const secret = process.env.INTERNAL_SECRET ?? 'tf-internal';
      
      console.log('[Worker] Running nightly profile embedding job...');
      const res = await fetch(`${backendUrl}/internal/embed-profiles`, {
        method: 'POST',
        headers: {
          'x-internal-secret': secret,
        },
      });

      if (!res.ok) {
        throw new Error(`Profile embedding failed: ${await res.text()}`);
      }
      
      const data = await res.json();
      console.log(`[Worker] Profile embedding complete. Processed: ${data.processed}`);
      return data;
    }
  },
  { connection: createRedisConnection() as any }
);

// Register repeatable job for nightly embedding (midnight every day)
profileQueue.add('nightly-embed', {}, {
  repeat: { pattern: '0 0 * * *' },
  jobId: 'nightly-embed-job'
});

// ─── Event listeners ──────────────────────────────────────────────────────────

worker.on('completed', (job) => {
  console.log(`[Worker] ✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  const submissionId = job?.data?.submissionId;
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, err.message);

  if (submissionId) {
    emitGradingEvent('grading:failed', submissionId, { reason: err.message });
  }
});

worker.on('stalled', (jobId) => {
  console.warn(`[Worker] ⚠️  Job ${jobId} stalled — auto-recovering`);
});

worker.on('error', (err) => {
  if (isTransientSocketError(err)) return;
  console.error('[Worker] Worker runtime error:', err.message);
});

profileWorker.on('error', (err) => {
  if (isTransientSocketError(err)) return;
  console.error('[Worker] ProfileWorker runtime error:', err.message);
});

console.log('[Worker] 🚀 Grading worker active (concurrency: 4, stalledInterval: 15s)');

