import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface SchemaIdCheckResult {
  ok: boolean;
  errors: string[];
  ids: Map<string, string>;
}

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function schemaPaths(rootDir: string): string[] {
  const schemasDir = path.join(rootDir, "schemas");

  if (!existsSync(schemasDir)) {
    return [];
  }

  return readdirSync(schemasDir)
    .filter((entry) => entry.endsWith(".schema.json"))
    .map((entry) => path.join(schemasDir, entry))
    .sort();
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
}

export function checkSchemaIds(rootDir: string = repoRoot()): SchemaIdCheckResult {
  const errors: string[] = [];
  const ids = new Map<string, string>();

  for (const schemaPath of schemaPaths(rootDir)) {
    const schema = readJson(schemaPath);
    const schemaId = schema.$id;
    const relativePath = path.relative(rootDir, schemaPath);

    if (typeof schemaId !== "string" || schemaId.length === 0) {
      errors.push(`${relativePath} is missing $id`);
      continue;
    }

    const previousPath = ids.get(schemaId);
    if (previousPath) {
      errors.push(`${relativePath} duplicates $id from ${previousPath}: ${schemaId}`);
    } else {
      ids.set(schemaId, relativePath);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    ids
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
    const result = checkSchemaIds(rootDir);

    if (!result.ok) {
      console.error(result.errors.join("\n"));
      process.exitCode = 1;
    }
  }
}
