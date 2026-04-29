import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";
import { describe, expect, it } from "../test-support/assertions.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "schemas/eip.run-status.v1.schema.json");
const commonSchemaPath = path.join(repoRoot, "schemas/eip.common.v1.schema.json");
const validFixturesDir = path.join(repoRoot, "fixtures/run-status/v1/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/run-status/v1/invalid");

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

describe("EIP-0005 RunStatusSnapshot schema", () => {
  const schema = readJson(schemaPath) as AnySchema;
  const commonSchema = readJson(commonSchemaPath) as AnySchema;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(commonSchema, "eip.common.v1.schema.json");
  const validate = ajv.compile(schema);

  function runStatusSnapshot(
    overrides: Record<string, unknown> = {}
  ): Record<string, unknown> {
    return {
      schemaVersion: "eip.run-status.v1",
      id: "sts_01HV9ZX8J2K6T3QW4R5Y7M8N9S",
      requestId: "req_01HV9ZX8J2K6T3QW4R5Y7M8N9Q",
      correlationId: "corr_01HV9ZX8J2K6T3QW4R5Y7M8N9R",
      status: "running",
      observedAt: "2026-04-29T00:00:00Z",
      ...overrides,
    };
  }

  it("requires the RunStatusSnapshot v1 polling contract fields", () => {
    expect(schema).toHaveProperty("required", [
      "schemaVersion",
      "id",
      "requestId",
      "correlationId",
      "status",
      "observedAt",
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

  it("accepts polling statuses including terminal status echoes", () => {
    for (const status of [
      "accepted",
      "queued",
      "running",
      "cancelling",
      "cancelled",
      "completed",
      "failed",
      "blocked",
      "unknown",
    ]) {
      expect(
        validate(runStatusSnapshot({ status })),
        JSON.stringify(validate.errors, null, 2)
      ).toBe(true);
    }
  });

  it("supports optional runId, message, and progress", () => {
    expect(
      validate(
        runStatusSnapshot({
          runId: "run_01HV9ZX8J2K6T3QW4R5Y7M8N9T",
          message: "Executor is running verification.",
          progress: {
            current: 2,
            total: 5,
            unit: "steps",
          },
        })
      ),
      JSON.stringify(validate.errors, null, 2)
    ).toBe(true);
  });

  it("rejects final-result-only fields", () => {
    expect(
      validate(
        runStatusSnapshot({
          completedAt: "2026-04-29T00:05:00Z",
          changeRequests: [{ changeRequestId: "pr_01HV9ZX8J2K6T3QW4R5Y7M8N9U" }],
        })
      )
    ).toBe(false);
  });
});

describe("EIP-0005 RunStatusSnapshot docs", () => {
  it("documents RunResult separation and Ensen-flow executor connector use", () => {
    const docs = readMarkdown("docs/EIP-0005-run-status-snapshot.md");

    expect(docs).toContain("RunResult");
    expect(docs).toContain("final details");
    expect(docs).toContain("Ensen-flow executor connector");
    expect(docs).toContain("without importing Ensen-loop");
  });
});
