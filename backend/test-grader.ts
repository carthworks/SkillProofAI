import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const prisma = new PrismaClient();
const redisUrl = process.env.REDIS_URL || 'redis://:redis_pwd@localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const gradingQueue = new Queue('grading', { connection });

async function runTest() {
  console.log('🧪 Starting backend grader test...');

  // 1. Get the "Two Sum" problem
  const problem = await prisma.problem.findUnique({ where: { slug: 'two-sum' } });
  if (!problem) throw new Error('Two Sum problem not found. Did you seed the DB?');

  // 2. Get or create a dummy user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hash',
        name: 'Test User',
        domain: 'cse'
      }
    });
  }

  // 3. Create a Submission record
  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId: problem.id,
      code: 'dummy-s3-key-for-test',
      status: 'queued'
    }
  });
  console.log(`✅ Created pending submission: ${submission.id}`);

  // 4. Add job to the queue
  await gradingQueue.add('grade', {
    submissionId: submission.id,
    userId: user.id,
    problemId: problem.id,
    s3Key: 'dummy-s3-key-for-test',
    language: 'python' // This triggers the worker's python fallback stub: print("0 1")
  });
  console.log('✅ Added job to BullMQ. Waiting 10 seconds for worker to grade it...');

  // 5. Wait for the worker to process it
  await new Promise(r => setTimeout(r, 10000));

  // 6. Fetch the updated submission to see the grader's results
  const updated = await prisma.submission.findUnique({ where: { id: submission.id } });
  
  console.log('\n=======================================');
  console.log('         GRADING RESULTS');
  console.log('=======================================');
  console.log(`Status: ${updated?.status}`);
  console.log(`Composite Score: ${updated?.score}`);
  
  if (updated?.feedback) {
    const feedback = JSON.parse(updated.feedback);
    console.log('\n--- Correctness ---');
    console.log(`Score: ${feedback.correctness?.score}/100`);
    console.log(`Passed: ${feedback.correctness?.passedCount} / ${feedback.correctness?.totalCount} cases`);
    console.log('Cases summary:');
    feedback.correctness?.cases?.forEach((c: any) => {
        console.log(`  [${c.passed ? 'PASS' : 'FAIL'}] ${c.description} (Expected: '${c.expected}', Actual: '${c.actual}')`);
    });

    console.log('\n--- Complexity ---');
    console.log(`Estimated: ${feedback.complexity?.estimated}`);
    console.log(`Expected:  ${feedback.complexity?.expected}`);
    console.log(`Score:     ${feedback.complexity?.score}/100`);

    console.log('\n--- Style ---');
    console.log(`Score: ${feedback.style?.score}/100`);
    console.log(`Violations: ${feedback.style?.violations?.length}`);
  }

  await prisma.$disconnect();
  await connection.quit();
}

runTest().catch(console.error);
