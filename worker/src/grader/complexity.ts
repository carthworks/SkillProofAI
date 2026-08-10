/**
 * complexity.ts  —  Day 8 Grader
 *
 * Estimates the runtime complexity of a submission by curve-fitting
 * execution time vs input size (n).  Scores 0-100 based on whether the
 * observed complexity matches the problem's expected complexity.
 */

export type BigOClass = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n^2)' | 'O(n^3)' | 'O(2^n)' | 'unknown';

export interface ComplexityResult {
  score:             number;      // 0-100
  estimated:         BigOClass;
  expected:          string;
  confidence:        number;      // 0-1, how well the best curve fits (R²)
  timeSamples:       Array<{ n: number; elapsedMs: number }>;
}

// ─── Scoring table ───────────────────────────────────────────────────────────
// Maps (expected → estimated) to score.
// Full score when correct, partial if one step off, 0 when far off.
const COMPLEXITY_SCORES: Record<string, Record<string, number>> = {
  'O(n)':      { 'O(1)': 100, 'O(log n)': 100, 'O(n)': 100, 'O(n log n)': 70, 'O(n^2)': 30, 'O(n^3)': 0,  'O(2^n)': 0, 'unknown': 50 },
  'O(n log n)':{ 'O(1)': 100, 'O(log n)': 100, 'O(n)': 100, 'O(n log n)': 100,'O(n^2)': 50, 'O(n^3)': 0,  'O(2^n)': 0, 'unknown': 50 },
  'O(n^2)':   { 'O(1)': 100, 'O(log n)': 100, 'O(n)': 100, 'O(n log n)': 100,'O(n^2)': 100,'O(n^3)': 60, 'O(2^n)': 0, 'unknown': 50 },
  'O(1)':     { 'O(1)': 100, 'O(log n)': 80,  'O(n)': 50,  'O(n log n)': 30, 'O(n^2)': 0,  'O(n^3)': 0,  'O(2^n)': 0, 'unknown': 50 },
  'O(log n)': { 'O(1)': 100, 'O(log n)': 100, 'O(n)': 70,  'O(n log n)': 50, 'O(n^2)': 0,  'O(n^3)': 0,  'O(2^n)': 0, 'unknown': 50 },
};

// ─── Curve fitting helpers ───────────────────────────────────────────────────

/**
 * Pearson R² for two same-length numeric arrays.
 */
function r2(xs: number[], ys: number[]): number {
  const n    = xs.length;
  if (n < 2) return 0;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let ssTot = 0;
  let ssRes = 0;

  // Simple linear regression  y = a*x + b
  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, b, i) => a + b * ys[i], 0);
  const sumX2 = xs.reduce((a, b) => a + b * b, 0);
  const denom = n * sumX2 - sumX * sumX;

  if (Math.abs(denom) < 1e-10) return 0;

  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;

  for (let i = 0; i < n; i++) {
    const yHat = a * xs[i] + b;
    ssRes += (ys[i] - yHat) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }

  return ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
}

/**
 * Clamp a value above a small epsilon to avoid log(0).
 */
const safe = (v: number) => Math.max(v, 0.1);

/**
 * Given n-values and time-values, return the best-fitting BigO class and its R².
 */
function bestFit(ns: number[], ts: number[]): { cls: BigOClass; r2Value: number } {
  const candidates: Array<{ cls: BigOClass; xs: number[] }> = [
    { cls: 'O(1)',       xs: ns.map(() => 1) },
    { cls: 'O(log n)',   xs: ns.map((n) => Math.log2(safe(n))) },
    { cls: 'O(n)',       xs: ns.map((n) => n) },
    { cls: 'O(n log n)', xs: ns.map((n) => n * Math.log2(safe(n))) },
    { cls: 'O(n^2)',     xs: ns.map((n) => n * n) },
    { cls: 'O(n^3)',     xs: ns.map((n) => n * n * n) },
  ];

  let best: { cls: BigOClass; r2Value: number } = { cls: 'unknown', r2Value: -1 };
  for (const { cls, xs } of candidates) {
    const score = r2(xs, ts);
    if (score > best.r2Value) {
      best = { cls, r2Value: score };
    }
  }
  return best;
}



/**
 * Classifies Big-O complexity using ratio fitting across scaled inputs (n, 2n, 4n).
 * Growth ratios R1 = T(2n)/T(n) and R2 = T(4n)/T(2n):
 *  - O(1) / O(log n) : R1 ~ 1.0 - 1.3
 *  - O(n)            : R1 ~ 1.8 - 2.4
 *  - O(n log n)      : R1 ~ 2.5 - 3.4
 *  - O(n^2)          : R1 ~ 3.5 - 4.5
 */
export function classifyByScalingRatios(timeSamples: Array<{ n: number; elapsedMs: number }>): {
  estimated: BigOClass;
  ratios: { r1: number; r2: number };
} {
  if (timeSamples.length < 3) {
    return { estimated: 'O(n)', ratios: { r1: 2.0, r2: 2.0 } };
  }

  const sorted = [...timeSamples].sort((a, b) => a.n - b.n);
  const t1 = Math.max(0.1, sorted[0].elapsedMs);
  const t2 = Math.max(0.1, sorted[Math.floor(sorted.length / 2)].elapsedMs);
  const t3 = Math.max(0.1, sorted[sorted.length - 1].elapsedMs);

  const r1 = t2 / t1;
  const r2 = t3 / t2;
  const avgRatio = (r1 + r2) / 2;

  let estimated: BigOClass = 'O(n)';
  if (avgRatio <= 1.3) {
    estimated = 'O(1)';
  } else if (avgRatio <= 2.4) {
    estimated = 'O(n)';
  } else if (avgRatio <= 3.4) {
    estimated = 'O(n log n)';
  } else {
    estimated = 'O(n^2)';
  }

  return { estimated, ratios: { r1, r2 } };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Estimate complexity and score the submission.
 *
 * @param expectedComplexity  The expected complexity string from the problem description,
 *                            e.g. "O(n)", "O(n log n)".
 * @param elapsedTimes        Map of caseIndex -> elapsed milliseconds.
 * @param stdinSizes          Map of caseIndex -> byte length of stdin (used as proxy for n).
 */
export function gradeComplexity(
  expectedComplexity: string,
  elapsedTimes:       Map<number, number>,
  stdinSizes:         Map<number, number>,
): ComplexityResult {
  const timeSamples: Array<{ n: number; elapsedMs: number }> = [];

  for (const [idx, ms] of elapsedTimes) {
    const n = stdinSizes.get(idx) ?? 1;
    timeSamples.push({ n, elapsedMs: ms });
  }

  // Need at least 3 data points for a meaningful fit
  if (timeSamples.length < 3) {
    return {
      score:       50,
      estimated:   'unknown',
      expected:    expectedComplexity,
      confidence:  0,
      timeSamples,
    };
  }

  // Sort by n ascending for clean visualisation
  timeSamples.sort((a, b) => a.n - b.n);

  const ns = timeSamples.map((s) => s.n);
  const ts = timeSamples.map((s) => s.elapsedMs);

  const { cls: bestClass, r2Value: confidence } = bestFit(ns, ts);
  const { estimated: ratioClass } = classifyByScalingRatios(timeSamples);

  // Pick ratioClass if confidence is low, else bestClass
  const estimated = confidence > 0.6 ? bestClass : ratioClass;

  // Look up score from table; fall back to 50 (neutral) if key not found
  const row   = COMPLEXITY_SCORES[expectedComplexity];
  const score = row ? (row[estimated] ?? 50) : 50;

  return { score, estimated, expected: expectedComplexity, confidence, timeSamples };
}

