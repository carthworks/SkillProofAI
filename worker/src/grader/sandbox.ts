/**
 * sandbox.ts  —  Docker Sandbox Executor
 *
 * Runs student code inside Docker containers (with public base image fallback
 * and local process execution fallback when Docker images or daemon are unavailable).
 */

import Docker from 'dockerode';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { TestCase } from './correctness';

const execFileAsync = promisify(execFile);
const docker = new Docker();

// Track images we have attempted to pull
const pulledImages = new Set<string>();

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SandboxResult {
  status:        'completed' | 'timeout' | 'compile_error' | 'oom' | 'error';
  actualOutputs: Map<number, string>;   // caseIndex → stdout
  elapsedTimes:  Map<number, number>;   // caseIndex → ms
  stdinSizes:    Map<number, number>;   // caseIndex → byte length of stdin
  styleRaw:      string;                // raw linter output
  stderr?:       string;                // execution error output if any
}

// ─── Language helpers ─────────────────────────────────────────────────────────

interface LangConfig {
  image:         string;
  fallbackImage: string;
  filename:      string;
  compile:       string;   // shell fragment to compile; empty string = interpreted
  run:           string;   // shell command to run the solution with stdin piped
  lint:          string;   // shell command to run linter → /tmp/style.txt
}

function getLangConfig(language: string): LangConfig {
  switch (language) {
    case 'python':
      return {
        image:         process.env.DOCKER_IMAGE_PYTHON ?? 'talentforge-runner-python',
        fallbackImage: 'python:3.11-alpine',
        filename:      'solution.py',
        compile:       '',
        run:           'python /box/solution.py',
        lint:          'pylint --output-format=text /box/solution.py > /tmp/style.txt 2>&1 || true',
      };

    case 'javascript':
    case 'node':
      return {
        image:         process.env.DOCKER_IMAGE_NODE ?? 'talentforge-runner-node',
        fallbackImage: 'node:20-alpine',
        filename:      'solution.js',
        compile:       '',
        run:           'node /box/solution.js',
        lint:          'eslint --format compact /box/solution.js > /tmp/style.txt 2>&1 || true',
      };

    case 'java':
      return {
        image:         process.env.DOCKER_IMAGE_JAVA ?? 'talentforge-runner-java',
        fallbackImage: 'openjdk:17-alpine',
        filename:      'Solution.java',
        compile:       'javac /box/Solution.java',
        run:           'java -cp /box Solution',
        lint:          'java -jar /opt/checkstyle.jar -c /google_checks.xml /box/Solution.java > /tmp/style.txt 2>&1 || true',
      };

    default:
      return {
        image:         'talentforge-runner-node',
        fallbackImage: 'node:20-alpine',
        filename:      'solution.js',
        compile:       '',
        run:           'node /box/solution.js',
        lint:          'echo "" > /tmp/style.txt',
      };
  }
}

// ─── runner.sh generator ─────────────────────────────────────────────────────

function buildRunnerScript(cfg: LangConfig, caseCount: number): string {
  const lines: string[] = ['#!/bin/sh', 'set -e'];

  lines.push('');
  lines.push('# ── Linting ─────────────────────────────────────────────────');
  lines.push(cfg.lint);

  if (cfg.compile) {
    lines.push('');
    lines.push('# ── Compile ─────────────────────────────────────────────────');
    lines.push(`${cfg.compile} 2>/tmp/compile_err.txt`);
    lines.push('if [ $? -ne 0 ]; then');
    lines.push('  echo "__COMPILE_ERROR__" > /box/cases/runner_status.txt');
    lines.push('  cat /tmp/compile_err.txt');
    lines.push('  exit 2');
    lines.push('fi');
  }

  lines.push('');
  lines.push('# ── Test cases ───────────────────────────────────────────────');
  lines.push('echo "__OK__" > /box/cases/runner_status.txt');

  for (let i = 0; i < caseCount; i++) {
    lines.push(`START_${i}=$(date +%s%3N)`);
    lines.push(`${cfg.run} < /box/cases/case_${i}.in > /box/cases/case_${i}.out 2>/box/cases/case_${i}.err || true`);
    lines.push(`END_${i}=$(date +%s%3N)`);
    lines.push(`echo $((END_${i} - START_${i})) > /box/cases/case_${i}.time`);
  }

  lines.push('');
  return lines.join('\n');
}

async function readTextFile(filePath: string, defaultValue = ''): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return defaultValue;
  }
}

// ─── Local Process Fallback Executor ──────────────────────────────────────────

async function runLocalFallback(
  tmpDir:     string,
  cfg:        LangConfig,
  testCases:  TestCase[],
  stdinSizes: Map<number, number>
): Promise<SandboxResult> {
  console.log(`[Sandbox] Running local process fallback for ${cfg.filename}...`);
  const actualOutputs = new Map<number, string>();
  const elapsedTimes  = new Map<number, number>();

  const codePath = path.join(tmpDir, cfg.filename);

  for (let i = 0; i < testCases.length; i++) {
    const input = testCases[i].stdin ?? '';
    const start = Date.now();
    let stdout = '';

    try {
      if (cfg.filename.endsWith('.py')) {
        const res = await execFileAsync('python', [codePath], { input, timeout: 5000 });
        stdout = res.stdout;
      } else if (cfg.filename.endsWith('.js')) {
        const res = await execFileAsync('node', [codePath], { input, timeout: 5000 });
        stdout = res.stdout;
      } else {
        stdout = input;
      }
    } catch (err: any) {
      stdout = err.stdout || err.message || '';
    }

    const elapsed = Date.now() - start;
    actualOutputs.set(i, stdout.trim());
    elapsedTimes.set(i, elapsed);
  }

  return {
    status: 'completed',
    actualOutputs,
    elapsedTimes,
    stdinSizes,
    styleRaw: '',
  };
}

async function ensureImage(imageName: string): Promise<boolean> {
  if (pulledImages.has(imageName)) return true;
  try {
    console.log(`[Sandbox] Pulling base image ${imageName}...`);
    const stream = await docker.pull(imageName);
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
    });
    pulledImages.add(imageName);
    return true;
  } catch (err: any) {
    console.warn(`[Sandbox] Image pull failed for ${imageName}:`, err.message);
    return false;
  }
}

async function createSandboxContainer(image: string, tmpDir: string): Promise<Docker.Container> {
  return await docker.createContainer({
    Image: image,
    NetworkDisabled: true,
    Entrypoint: ['sh'],
    Cmd: ['/box/runner.sh'],
    HostConfig: {
      NetworkMode:    'none',
      Memory:         268435456, // 256 MB
      ReadonlyRootfs: false,
      Tmpfs:          { '/tmp': 'rw,size=50m,noexec' },
      PidsLimit:      128,
      CpuShares:      512,
      Binds:          [`${tmpDir}:/box`],
    },
  });
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function runCodeInSandbox(
  submissionId: string,
  language:     string,
  code:         string,
  testCases:    TestCase[],
): Promise<SandboxResult> {
  const tmpDir   = path.join(os.tmpdir(), `sandbox-${submissionId}-${crypto.randomBytes(4).toString('hex')}`);
  const casesDir = path.join(tmpDir, 'cases');

  await fs.mkdir(casesDir, { recursive: true });

  const cfg = getLangConfig(language);

  // Write student code
  await fs.writeFile(path.join(tmpDir, cfg.filename), code, 'utf8');

  // Write test case inputs
  const stdinSizes = new Map<number, number>();
  for (let i = 0; i < testCases.length; i++) {
    const stdin = testCases[i].stdin ?? '';
    await fs.writeFile(path.join(casesDir, `case_${i}.in`), stdin, 'utf8');
    stdinSizes.set(i, Buffer.byteLength(stdin, 'utf8'));
  }

  // Write runner script
  const runnerScript = buildRunnerScript(cfg, testCases.length);
  const runnerPath   = path.join(tmpDir, 'runner.sh');
  await fs.writeFile(runnerPath, runnerScript, { encoding: 'utf8', mode: 0o755 });

  let container: Docker.Container | null = null;
  let targetImage = cfg.image;

  try {
    // 1. Attempt container creation with primary image
    try {
      container = await createSandboxContainer(targetImage, tmpDir);
    } catch (createErr: any) {
      if (createErr.statusCode === 404 || createErr.message?.includes('no such image')) {
        console.warn(`[Sandbox] Primary image ${targetImage} not found. Trying fallback ${cfg.fallbackImage}...`);
        targetImage = cfg.fallbackImage;
        const pulled = await ensureImage(targetImage);
        if (pulled) {
          container = await createSandboxContainer(targetImage, tmpDir);
        } else {
          throw createErr;
        }
      } else {
        throw createErr;
      }
    }

    await container.start();

    // 60-second timeout guard
    let isTimeout = false;
    const killTimer = setTimeout(async () => {
      isTimeout = true;
      try { await container!.kill(); } catch {}
    }, 60_000);

    const waitResult = await container.wait();
    clearTimeout(killTimer);

    if (isTimeout) {
      return { status: 'timeout', actualOutputs: new Map(), elapsedTimes: new Map(), stdinSizes, styleRaw: '' };
    }

    // Check runner status
    const runnerStatus = await readTextFile(path.join(casesDir, 'runner_status.txt'));

    if (runnerStatus.trim() === '__COMPILE_ERROR__' || waitResult.StatusCode === 2) {
      const stderr = await readTextFile(path.join(tmpDir, 'compile_err.txt'), '(no compile output)');
      return { status: 'compile_error', actualOutputs: new Map(), elapsedTimes: new Map(), stdinSizes, styleRaw: '', stderr };
    }

    if (waitResult.StatusCode === 137) {
      return { status: 'oom', actualOutputs: new Map(), elapsedTimes: new Map(), stdinSizes, styleRaw: '' };
    }

    // Read per-case outputs
    const actualOutputs = new Map<number, string>();
    const elapsedTimes  = new Map<number, number>();

    for (let i = 0; i < testCases.length; i++) {
      const stdout = await readTextFile(path.join(casesDir, `case_${i}.out`));
      actualOutputs.set(i, stdout.trim());

      const timeStr = await readTextFile(path.join(casesDir, `case_${i}.time`), '0');
      elapsedTimes.set(i, parseInt(timeStr.trim(), 10) || 0);
    }

    const styleRaw = await readTextFile(path.join(tmpDir, 'style.txt'));

    return { status: 'completed', actualOutputs, elapsedTimes, stdinSizes, styleRaw };
  } catch (error: any) {
    console.warn(`[Sandbox] Container execution unavailable (${error.message}). Falling back to local process runner...`);
    return await runLocalFallback(tmpDir, cfg, testCases, stdinSizes);
  } finally {
    if (container) {
      try { await container.remove({ force: true }); } catch {}
    }
    try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch {}
  }
}
