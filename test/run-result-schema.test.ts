import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "schemas/eip.run-result.v1.schema.json");
const commonSchemaPath = path.join(repoRoot, "schemas/eip.common.v1.schema.json");
const validFixturesDir = path.join(repoRoot, "fixtures/run-result/v1/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/run-result/v1/invalid");

function readJson(relativeOrAbsolutePath: string): unknown {
  const filePath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(repoRoot, relativeOrAbsolutePath);

  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function readMarkdown(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function fixturePaths(directory: string): string[] {
  return readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => path.join(directory, entry))
    .sort();
}

describe("EIP-0002 RunResult schema", () => {
  const schema = readJson(schemaPath);
  const commonSchema = readJson(commonSchemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(commonSchema, "eip.common.v1.schema.json");
  const validate = ajv.compile(schema);

  function runResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      schemaVersion: "eip.run-result.v1",
      id: "runresult_01HV9ZX8J2K6T3QW4R5Y7M8N9P",
      requestId: "runrequest_01HV9ZX8J2K6T3QW4R5Y7M8N9Q",
      correlationId: "corr_01HV9ZX8J2K6T3QW4R5Y7M8N9R",
      status: "succeeded",
      completedAt: "2026-04-29T00:00:00Z",
      ...overrides,
    };
  }

  it("requires the RunResult v1 terminal contract fields", () => {
    expect(schema).toHaveProperty("required", [
      "schemaVersion",
      "id",
      "requestId",
      "correlationId",
      "status",
      "completedAt",
    ]);
  });

  it.each(fixturePaths(validFixturesDir))("accepts valid fixture %s", (fixturePath) => {
    const fixture = readJson(fixturePath);

    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it.each(fixturePaths(invalidFixturesDir))(
    "rejects invalid fixture %s",
    (fixturePath) => {
      const fixture = readJson(fixturePath);

      expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(false);
    }
  );

  it("accepts terminal statuses and rejects in-progress statuses", () => {
    for (const status of ["succeeded", "failed", "blocked", "needs_review", "cancelled"]) {
      expect(validate(runResult({ status })), JSON.stringify(validate.errors, null, 2)).toBe(
        true
      );
    }

    for (const status of ["queued", "running"]) {
      expect(validate(runResult({ status }))).toBe(false);
    }
  });

  it("supports result evidence, verification, diagnostics, and metrics", () => {
    const fixture = readJson(
      "fixtures/run-result/v1/valid/succeeded-result.json"
    ) as Record<string, unknown>;

    expect(fixture).toHaveProperty("changeRequests");
    expect(fixture).toHaveProperty("evidenceBundles");
    expect(fixture).toHaveProperty("verification");
    expect(fixture).toHaveProperty("metrics");
    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });
});

describe("EIP-0002 RunResult docs", () => {
  it("documents final statuses and RunStatusSnapshot separation", () => {
    const docs = readMarkdown("docs/EIP-0002-run-result.md");

    expect(docs).toContain("queued");
    expect(docs).toContain("running");
    expect(docs).toContain("RunStatusSnapshot");
    expect(docs).toContain("final statuses");
  });
});
