import fs from "node:fs";
import path from "node:path";

export interface ValidationTask {
  action: "TYPECHECK_VALIDATION" | "LINT_VALIDATION" | "BUILD_VALIDATION" | "TEST_VALIDATION";
  command: string;
  tool: string;
  stateEnum: string;
  order: number;
}

export interface ProjectEnvironment {
  packageManager: "pnpm" | "yarn" | "bun" | "npm";
  scripts: Record<string, string>;
  availableValidationTasks: ValidationTask[];
  hasWorkspaces: boolean;
}

/**
 * Inspect project ecosystem (package manager, scripts, workspaces)
 */
export function inspectProjectEnvironment(cwd: string = process.cwd()): ProjectEnvironment {
  let packageManager: "pnpm" | "yarn" | "bun" | "npm" = "npm";

  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
    packageManager = "pnpm";
  } else if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
    packageManager = "yarn";
  } else if (
    fs.existsSync(path.join(cwd, "bun.lockb")) ||
    fs.existsSync(path.join(cwd, "bun.lock"))
  ) {
    packageManager = "bun";
  }

  let scripts: Record<string, string> = {};
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      scripts = pkg.scripts || {};
    } catch (e) {
      console.warn("[ValidationResolver] Failed to parse package.json:", e);
    }
  }

  const runPrefix = packageManager === "npm" ? "npm run" : `${packageManager} run`;
  const tasks: ValidationTask[] = [];

  // Priority order: 1. typecheck -> 2. lint -> 3. build -> 4. test
  if (scripts.typecheck) {
    tasks.push({
      action: "TYPECHECK_VALIDATION",
      command: `${runPrefix} typecheck`,
      tool: `${packageManager}_typecheck`,
      stateEnum: "RUNNING_TESTS",
      order: 1,
    });
  }

  if (scripts.lint) {
    tasks.push({
      action: "LINT_VALIDATION",
      command: `${runPrefix} lint`,
      tool: `${packageManager}_lint`,
      stateEnum: "RUNNING_TESTS",
      order: 2,
    });
  }

  if (scripts.build) {
    tasks.push({
      action: "BUILD_VALIDATION",
      command: `${runPrefix} build`,
      tool: `${packageManager}_build`,
      stateEnum: "BUILD_VALIDATION",
      order: 3,
    });
  }

  if (scripts.test) {
    tasks.push({
      action: "TEST_VALIDATION",
      command: `${runPrefix} test`,
      tool: `${packageManager}_test`,
      stateEnum: "RUNNING_TESTS",
      order: 4,
    });
  }

  const hasWorkspaces =
    fs.existsSync(path.join(cwd, "turbo.json")) ||
    fs.existsSync(path.join(cwd, "pnpm-workspace.yaml"));

  return {
    packageManager,
    scripts,
    availableValidationTasks: tasks,
    hasWorkspaces,
  };
}

/**
 * Dynamically resolves all executable validation tasks defined in the target repository
 */
export function resolveValidationCommands(cwd: string = process.cwd()): ValidationTask[] {
  const env = inspectProjectEnvironment(cwd);
  return env.availableValidationTasks;
}
