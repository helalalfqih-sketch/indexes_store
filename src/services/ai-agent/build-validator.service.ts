/**
 * Phase 2: Self-Correction Build Validator Service
 * Executes TypeScript typecheck validation and formats diagnostic errors for AI self-correction loops.
 */
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface BuildErrorDetail {
  file: string;
  line?: number;
  column?: number;
  code?: string;
  message: string;
}

export interface BuildValidationResult {
  passed: boolean;
  errorCount: number;
  errors: BuildErrorDetail[];
  summary: string;
  durationMs: number;
}

/**
 * Validates current workspace TypeScript compilation state (tsc --noEmit).
 */
export async function validateBuildState(): Promise<BuildValidationResult> {
  const startTime = Date.now();
  try {
    const { stdout, stderr } = await execAsync("npx tsc --noEmit", {
      cwd: process.cwd(),
      timeout: 30000,
    });

    const output = (stdout || "") + (stderr || "");
    const durationMs = Date.now() - startTime;

    if (!output.trim()) {
      return {
        passed: true,
        errorCount: 0,
        errors: [],
        summary: "Build validation passed cleanly with 0 type errors.",
        durationMs,
      };
    }

    const parsedErrors = parseTscOutput(output);
    return {
      passed: parsedErrors.length === 0,
      errorCount: parsedErrors.length,
      errors: parsedErrors,
      summary:
        parsedErrors.length === 0
          ? "Build validation passed cleanly."
          : `Found ${parsedErrors.length} typecheck errors.`,
      durationMs,
    };
  } catch (err: any) {
    const output = (err?.stdout || "") + (err?.stderr || "") + (err?.message || "");
    const parsedErrors = parseTscOutput(output);
    const durationMs = Date.now() - startTime;

    return {
      passed: false,
      errorCount: parsedErrors.length || 1,
      errors:
        parsedErrors.length > 0
          ? parsedErrors
          : [{ file: "workspace", message: err?.message || "Build failed" }],
      summary: `Build validation failed with ${parsedErrors.length || 1} error(s).`,
      durationMs,
    };
  }
}

/**
 * Parses raw tsc --noEmit output lines into structured BuildErrorDetail objects.
 */
function parseTscOutput(output: string): BuildErrorDetail[] {
  const errors: BuildErrorDetail[] = [];
  const lines = output.split("\n");

  // Regex matches: src/components/foo.tsx(12,5): error TS2304: Cannot find name 'bar'.
  const tscRegex = /^(.+?)\((\d+),(\d+)\):\s*error\s*(TS\d+):\s*(.+)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = tscRegex.exec(trimmed);
    if (match) {
      errors.push({
        file: match[1].replace(/\\/g, "/"),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],
        message: match[5],
      });
    }
  }

  return errors.slice(0, 10);
}
