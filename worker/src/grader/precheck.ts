/**
 * precheck.ts — Pre-run AST / Regex Security Blocklist Scanner
 *
 * Inspects candidate code prior to container instantiation to block dangerous
 * system calls, process spawning, or restricted file system access.
 */

export interface PrecheckResult {
  allowed: boolean;
  reason?: string;
  matchedPattern?: string;
}

const PYTHON_BLOCKLIST = [
  { pattern: /\bsubprocess\b/, name: 'subprocess' },
  { pattern: /\bos\.system\b/, name: 'os.system' },
  { pattern: /\beval\s*\(/, name: 'eval(' },
  { pattern: /\bexec\s*\(/, name: 'exec(' },
  { pattern: /\b__import__\b/, name: '__import__' },
  { pattern: /\bopen\s*\(/, name: 'open(' },
];

const JAVASCRIPT_BLOCKLIST = [
  { pattern: /\bchild_process\b/, name: 'child_process' },
  { pattern: /\bfs\b/, name: 'fs' },
  { pattern: /\beval\s*\(/, name: 'eval(' },
  { pattern: /\bprocess\.exit\b/, name: 'process.exit' },
];

const JAVA_BLOCKLIST = [
  { pattern: /\bRuntime\.getRuntime\b/, name: 'Runtime.getRuntime' },
  { pattern: /\bProcessBuilder\b/, name: 'ProcessBuilder' },
  { pattern: /\bSystem\.exit\b/, name: 'System.exit' },
];

/**
 * Statically scans candidate code against security blocklists before sandbox execution.
 */
export function precheckCode(code: string, language: string): PrecheckResult {
  if (!code || !code.trim()) {
    return { allowed: true };
  }

  const lang = language.toLowerCase();
  let blocklist = PYTHON_BLOCKLIST;

  if (lang === 'javascript' || lang === 'js' || lang === 'node') {
    blocklist = JAVASCRIPT_BLOCKLIST;
  } else if (lang === 'java') {
    blocklist = JAVA_BLOCKLIST;
  }

  for (const item of blocklist) {
    if (item.pattern.test(code)) {
      return {
        allowed: false,
        reason: `Security Violation: Code contains restricted call "${item.name}"`,
        matchedPattern: item.name,
      };
    }
  }

  return { allowed: true };
}
