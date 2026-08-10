/**
 * style.ts  —  Day 8 Grader
 *
 * Parses the linter output written to /tmp/style.txt inside the sandbox
 * and produces a code-quality score from 0-100.
 *
 * Supported linters:
 *   - pylint  (Python)
 *   - eslint  (JavaScript / Node)
 *   - checkstyle  (Java)
 */

export interface StyleViolation {
  line:     number;
  severity: 'error' | 'warning' | 'info';
  message:  string;
}

export interface StyleResult {
  score:      number;           // 0-100
  violations: StyleViolation[];
  raw:        string;
}

// ─── Penalty table ───────────────────────────────────────────────────────────
const PENALTY: Record<'error' | 'warning' | 'info', number> = {
  error:   10,
  warning:  5,
  info:     2,
};
const MAX_PENALTY = 100;

// ─── Parser: pylint ──────────────────────────────────────────────────────────
// Output format:  "solution.py:12:4: C0303 (trailing-whitespace) ..."
// Severity codes: C=convention, R=refactor, W=warning, E=error, F=fatal
function parsePylint(raw: string): StyleViolation[] {
  const violations: StyleViolation[] = [];
  const re = /^\S+:(\d+):\d+:\s+([CRWEF])\d+\s+.*$/gm;

  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const lineNum  = parseInt(m[1], 10);
    const code     = m[2];
    const severity: 'error' | 'warning' | 'info' =
      code === 'E' || code === 'F' ? 'error' :
      code === 'W'                  ? 'warning' : 'info';
    violations.push({ line: lineNum, severity, message: m[0].trim() });
  }
  return violations;
}

// ─── Parser: eslint ──────────────────────────────────────────────────────────
// Output format (compact):  "/box/solution.js: line 12, col 4, Error - ..."
function parseEslint(raw: string): StyleViolation[] {
  const violations: StyleViolation[] = [];
  const re = /line\s+(\d+),\s+col\s+\d+,\s+(Error|Warning|Info)\s+-\s+(.+)/gi;

  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const severity: 'error' | 'warning' | 'info' =
      m[2].toLowerCase() === 'error'   ? 'error' :
      m[2].toLowerCase() === 'warning' ? 'warning' : 'info';
    violations.push({ line: parseInt(m[1], 10), severity, message: m[3].trim() });
  }
  return violations;
}

// ─── Parser: checkstyle ──────────────────────────────────────────────────────
// Output format:  "[WARN] /box/Solution.java:12:4: message [RuleName]"
function parseCheckstyle(raw: string): StyleViolation[] {
  const violations: StyleViolation[] = [];
  const re = /\[(WARN|ERROR|INFO)\]\s+\S+:(\d+)(?::\d+)?:\s+(.+)/gi;

  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const severity: 'error' | 'warning' | 'info' =
      m[1].toLowerCase() === 'error'   ? 'error' :
      m[1].toLowerCase() === 'warn'    ? 'warning' : 'info';
    violations.push({ line: parseInt(m[2], 10), severity, message: m[3].trim() });
  }
  return violations;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Parse the raw linter output and compute a style score.
 *
 * @param raw       Contents of /tmp/style.txt captured from the container.
 * @param language  'python' | 'javascript' | 'java'
 */
export function gradeStyle(raw: string, language: string): StyleResult {
  if (!raw.trim()) {
    // No linter output → perfect style
    return { score: 100, violations: [], raw };
  }

  let violations: StyleViolation[];
  if (language === 'python') {
    violations = parsePylint(raw);
  } else if (language === 'javascript' || language === 'node') {
    violations = parseEslint(raw);
  } else if (language === 'java') {
    violations = parseCheckstyle(raw);
  } else {
    violations = [];
  }

  // Calculate penalty
  const penalty = violations.reduce(
    (sum, v) => sum + (PENALTY[v.severity] ?? 0),
    0,
  );

  const score = Math.max(0, 100 - Math.min(penalty, MAX_PENALTY));

  return { score, violations, raw };
}
