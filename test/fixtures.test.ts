import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateFixtures } from "../scripts/validate-fixtures.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function withTempRepo(assertion: (rootDir: string) => void): void {
  const rootDir = mkdtempSync(path.join(tmpdir(), "ensen-fixtures-"));

  try {
    assertion(rootDir);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
}

function writeJson(filePath: string, value: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMinimalSchema(rootDir: string, schemaName: string): void {
  const schemasDir = path.join(rootDir, "schemas");
  mkdirSync(schemasDir, { recursive: true });
  writeJson(path.join(schemasDir, schemaName), {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://example.invalid/${schemaName}`,
    type: "object"
  });
}

describe("conformance fixture validation", () => {
  const result = validateFixtures(repoRoot);

  it("validates every valid and invalid fixture case", () => {
    expect(result.failures).toEqual([]);
  });

  it("covers the currently published fixture suite", () => {
    expect(result.cases.map((validationCase) => path.relative(repoRoot, validationCase.fixturePath))).toEqual([
      "fixtures/common/v1/valid/common-envelope.json",
      "fixtures/common/v1/invalid/bad-classification.json",
      "fixtures/common/v1/invalid/bad-extension-key.json",
      "fixtures/common/v1/invalid/bad-timestamp.json",
      "fixtures/common/v1/invalid/missing-actor-binding.json",
      "fixtures/run-request/v1/valid/github-issue-request.json",
      "fixtures/run-request/v1/valid/manual-request.json",
      "fixtures/run-request/v1/invalid/bad-schema-version.json",
      "fixtures/run-request/v1/invalid/raw-secret.json",
      "fixtures/run-request/v1/invalid/source-string.json",
      "fixtures/run-request/v1/invalid/unknown-top-level-field.json",
      "fixtures/run-result/v1/valid/blocked-result.json",
      "fixtures/run-result/v1/valid/failed-result.json",
      "fixtures/run-result/v1/valid/succeeded-result.json",
      "fixtures/run-result/v1/invalid/missing-request-id.json",
      "fixtures/run-result/v1/invalid/running-status.json",
      "fixtures/audit-event/v1/valid/flow-step-completed.json",
      "fixtures/audit-event/v1/valid/loop-run-requested.json",
      "fixtures/audit-event/v1/invalid/bad-event-type.json",
      "fixtures/audit-event/v1/invalid/forbidden-timestamp.json",
      "fixtures/evidence-bundle-ref/v1/valid/file-uri.json",
      "fixtures/evidence-bundle-ref/v1/valid/local-path.json",
      "fixtures/evidence-bundle-ref/v1/invalid/bad-checksum.json",
      "fixtures/evidence-bundle-ref/v1/invalid/raw-secret-uri.json",
      "fixtures/run-status/v1/valid/accepted-snapshot.json",
      "fixtures/run-status/v1/valid/completed-snapshot.json",
      "fixtures/run-status/v1/valid/running-snapshot.json",
      "fixtures/run-status/v1/invalid/final-result-only-fields.json"
    ]);
  });

  it("fails closed when schemas are missing", () => {
    withTempRepo((rootDir) => {
      const result = validateFixtures(rootDir);

      expect(result.ok).toBe(false);
      expect(result.failures).toContain("No schema files found under schemas");
    });
  });

  it("fails closed when a configured fixture suite has no files", () => {
    withTempRepo((rootDir) => {
      const fixturesDir = path.join(rootDir, "fixtures/run-request/v1/valid");
      writeMinimalSchema(rootDir, "eip.run-request.v1.schema.json");
      mkdirSync(fixturesDir, { recursive: true });
      writeJson(path.join(fixturesDir, "sample.json"), {});

      const result = validateFixtures(rootDir);

      expect(result.ok).toBe(false);
      expect(result.failures).toContain(
        "fixtures/common/v1: no fixture files found for schemas/eip.common.v1.schema.json"
      );
    });
  });

  it("reports malformed schema JSON as validation failures", () => {
    withTempRepo((rootDir) => {
      const schemasDir = path.join(rootDir, "schemas");
      const fixturesDir = path.join(rootDir, "fixtures/run-request/v1/valid");
      mkdirSync(schemasDir, { recursive: true });
      mkdirSync(fixturesDir, { recursive: true });
      writeFileSync(path.join(schemasDir, "eip.run-request.v1.schema.json"), "{");
      writeJson(path.join(fixturesDir, "sample.json"), {});

      const result = validateFixtures(rootDir);

      expect(result.ok).toBe(false);
      expect(
        result.failures.some((failure) =>
          failure.includes("schemas/eip.run-request.v1.schema.json: invalid schema JSON")
        )
      ).toBe(true);
      expect(result.failures).toContain("fixtures/run-request/v1/valid/sample.json: missing validator");
    });
  });

  it("reports malformed fixture JSON without aborting validation", () => {
    withTempRepo((rootDir) => {
      const fixturesDir = path.join(rootDir, "fixtures/run-request/v1/valid");
      writeMinimalSchema(rootDir, "eip.run-request.v1.schema.json");
      mkdirSync(fixturesDir, { recursive: true });
      writeFileSync(path.join(fixturesDir, "broken.json"), "{");

      const result = validateFixtures(rootDir);

      expect(result.ok).toBe(false);
      expect(
        result.failures.some((failure) =>
          failure.includes("fixtures/run-request/v1/valid/broken.json: invalid JSON")
        )
      ).toBe(true);
    });
  });
});
