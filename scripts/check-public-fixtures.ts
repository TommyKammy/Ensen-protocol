import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface PublicFixtureFinding {
  filePath: string;
  pointer: string;
  reason: string;
}

export interface PublicFixtureSafetyResult {
  ok: boolean;
  findings: PublicFixtureFinding[];
}

const likelySecretValuePatterns: Array<[RegExp, string]> = [
  [/gh[pousr]_[A-Za-z0-9_]{20,}/, "GitHub token literal"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key literal"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key literal"],
  [/[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#\s]*[^/?#\s:@]+:[^/?#\s:@]+@/, "credential-bearing URI"],
  [/\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*[^,\s]+/i, "inline credential literal"]
];

const sensitiveKeyPattern = /(?:^|[-_.])(?:secret|token|password|passwd|privateKey|apiKey|accessKey)(?:$|[-_.])/i;
const customerSpecificValuePattern =
  /\b(?:acme|globex|initech|customer[_ -]?[a-z0-9-]+|tenant[_ -]?[a-z0-9-]+)\b/i;
const workstationPathPattern = /(?:\/Users\/[^/\s]+|[A-Za-z]:\\Users\\[^\\\s]+)/;

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function jsonFilesUnder(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return jsonFilesUnder(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    })
    .sort();
}

export function publicFixturePaths(rootDir: string = repoRoot()): string[] {
  return jsonFilesUnder(path.join(rootDir, "fixtures")).filter((filePath) =>
    filePath.split(path.sep).includes("valid")
  );
}

function pointerFor(parentPointer: string, key: string | number): string {
  return `${parentPointer}/${String(key).replace(/~/g, "~0").replace(/\//g, "~1")}`;
}

function inspectValue(
  value: unknown,
  filePath: string,
  pointer: string,
  findings: PublicFixtureFinding[],
  key?: string
): void {
  if (key && sensitiveKeyPattern.test(key)) {
    findings.push({
      filePath,
      pointer,
      reason: `sensitive key name: ${key}`
    });
  }

  if (typeof value === "string") {
    for (const [pattern, reason] of likelySecretValuePatterns) {
      if (pattern.test(value)) {
        findings.push({ filePath, pointer, reason });
      }
    }

    if (customerSpecificValuePattern.test(value)) {
      findings.push({ filePath, pointer, reason: "customer-specific value" });
    }

    if (workstationPathPattern.test(value)) {
      findings.push({ filePath, pointer, reason: "workstation-local absolute path" });
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      inspectValue(item, filePath, pointerFor(pointer, index), findings);
    });
    return;
  }

  if (value && typeof value === "object") {
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      inspectValue(nestedValue, filePath, pointerFor(pointer, nestedKey), findings, nestedKey);
    }
  }
}

export function checkPublicFixtures(filePaths: string[]): PublicFixtureSafetyResult {
  const findings: PublicFixtureFinding[] = [];

  for (const filePath of filePaths) {
    inspectValue(readJson(filePath), filePath, "", findings);
  }

  return {
    ok: findings.length === 0,
    findings
  };
}

function isDirectExecution(): boolean {
  const currentPath = fileURLToPath(import.meta.url);
  const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

  return currentPath === invokedPath;
}

if (isDirectExecution()) {
  const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : repoRoot();
  const stat = existsSync(rootDir) ? statSync(rootDir) : undefined;

  if (!stat?.isDirectory()) {
    console.error(`Invalid repository root: ${rootDir}`);
    process.exitCode = 1;
  } else {
    const result = checkPublicFixtures(publicFixturePaths(rootDir));

    if (!result.ok) {
      for (const finding of result.findings) {
        console.error(`${path.relative(rootDir, finding.filePath)}${finding.pointer}: ${finding.reason}`);
      }
      process.exitCode = 1;
    }
  }
}
