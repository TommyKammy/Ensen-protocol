import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkSchemaIds } from "../scripts/check-schema-ids.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function withTempRepo(assertion: (rootDir: string) => void): void {
  const rootDir = mkdtempSync(path.join(tmpdir(), "ensen-schema-ids-"));

  try {
    assertion(rootDir);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
}

describe("schema $id checks", () => {
  it("requires every schema $id to be present and unique", () => {
    const result = checkSchemaIds(repoRoot);

    expect(result.errors).toEqual([]);
    expect([...result.ids.keys()].sort()).toEqual([
      "https://eip.ensen.dev/schemas/eip.audit-event.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.common.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.evidence-bundle-ref.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.run-request.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.run-result.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.run-status.v1.schema.json"
    ]);
  });

  it("fails closed when schema discovery finds no schema files", () => {
    withTempRepo((rootDir) => {
      const result = checkSchemaIds(rootDir);

      expect(result.ok).toBe(false);
      expect(result.errors).toEqual(["No schema files found under schemas"]);
    });
  });

  it("reports malformed schema JSON without hiding later schema errors", () => {
    withTempRepo((rootDir) => {
      const schemasDir = path.join(rootDir, "schemas");
      mkdirSync(schemasDir, { recursive: true });
      writeFileSync(path.join(schemasDir, "bad.schema.json"), "{");
      writeFileSync(path.join(schemasDir, "missing-id.schema.json"), "{}\n");

      const result = checkSchemaIds(rootDir);

      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain("schemas/bad.schema.json is not valid JSON");
      expect(result.errors).toContain("schemas/missing-id.schema.json is missing $id");
    });
  });
});
