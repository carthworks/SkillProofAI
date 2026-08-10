/**
 * correctness.ts  —  Day 7 Grader
 *
 * Evaluates test case outputs against expected results.
 * Assigns a weighted pass-rate score from 0–100.
 */

export interface TestCase {
  stdin:          string;
  expectedStdout: string;
  description?:   string;
  weight?:        number; // 0-100; if omitted, all cases treated equally
}

export interface CaseResult {
  caseIndex:      number;
  description:    string;
  passed:         boolean;
  expected:       string;
  actual:         string;
  elapsedMs:      number;
  weight:         number;
  isHidden:       boolean;
}

export interface CorrectnessResult {
  score:          number;       // 0-100
  passedCount:    number;
  totalCount:     number;
  cases:          CaseResult[];
}

/**
 * Normalize output: trim trailing whitespace from each line,
 * remove trailing blank lines, normalise line endings.
 */
function normalize(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Grade correctness for a list of test cases.
 *
 * @param testCases      Combined public + hidden test cases with their metadata.
 * @param actualOutputs  Map of caseIndex -> raw stdout string captured from container.
 * @param elapsedTimes   Map of caseIndex -> elapsed time in milliseconds.
 * @param hiddenStart    Index at which hidden test cases begin (first N are public).
 */
export function gradeCorrectness(
  testCases:    TestCase[],
  actualOutputs: Map<number, string>,
  elapsedTimes:  Map<number, number>,
  hiddenStart:   number,
): CorrectnessResult {
  const results: CaseResult[] = [];

  // Assign equal weights if not provided
  const totalSpecifiedWeight = testCases.reduce((sum, tc) => sum + (tc.weight ?? 0), 0);
  const useEqualWeights = totalSpecifiedWeight === 0;
  const equalWeight = 100 / testCases.length;

  let weightedScore = 0;
  let totalWeight   = 0;
  let passedCount   = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc        = testCases[i];
    const weight    = useEqualWeights ? equalWeight : (tc.weight ?? equalWeight);
    const expected  = normalize(tc.expectedStdout);
    const raw       = actualOutputs.get(i) ?? '';
    const actual    = normalize(raw);
    const passed    = actual === expected;
    const elapsedMs = elapsedTimes.get(i) ?? 0;

    if (passed) {
      weightedScore += weight;
      passedCount++;
    }
    totalWeight += weight;

    results.push({
      caseIndex:   i,
      description: tc.description ?? `Case ${i + 1}`,
      passed,
      expected,
      actual,
      elapsedMs,
      weight,
      isHidden:    i >= hiddenStart,
    });
  }

  // Normalise score to 0-100 regardless of weight scheme
  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

  return {
    score,
    passedCount,
    totalCount: testCases.length,
    cases: results,
  };
}
