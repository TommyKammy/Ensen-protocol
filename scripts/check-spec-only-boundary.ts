import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const disallowedRuntimeDirectories = [
  "src/runtime",
  "src/workflow",
  "src/loop",
  "src/connectors"
] as const;

export interface BoundaryCheckResult {
  ok: boolean;
  violations: string[];
}

export function checkSpecOnlyBoundary(rootDir: string): BoundaryCheckResult {
  const violations = disallowedRuntimeDirectories.filter((relativePath) => {
    return existsSync(path.join(rootDir, relativePath));
  });

  return {
    ok: violations.length === 0,
    violations
  };
}

function formatViolationMessage(violations: string[]): string {
  return [
    "Spec-only boundary violated.",
    "Runtime implementation directories are not allowed in this repository:",
    ...violations.map((violation) => `- ${violation}`)
  ].join("\n");
}

function isDirectExecution(): boolean {
  const currentPath = fileURLToPath(import.meta.url);
  const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

  return currentPath === invokedPath;
}

if (isDirectExecution()) {
  const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

  if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
    console.error(`Invalid repository root: ${rootDir}`);
    process.exitCode = 1;
  } else {
    const result = checkSpecOnlyBoundary(rootDir);

    if (!result.ok) {
      console.error(formatViolationMessage(result.violations));
      process.exitCode = 1;
    }
  }
}
