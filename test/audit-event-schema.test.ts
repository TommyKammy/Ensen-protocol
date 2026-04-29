import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "schemas/eip.audit-event.v1.schema.json");
const commonSchemaPath = path.join(repoRoot, "schemas/eip.common.v1.schema.json");
const validFixturesDir = path.join(repoRoot, "fixtures/audit-event/v1/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/audit-event/v1/invalid");

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

function auditEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const fixture = readJson("fixtures/audit-event/v1/valid/loop-run-requested.json");

  return {
    ...(fixture as Record<string, unknown>),
    ...overrides,
  };
}

describe("EIP-0003 AuditEvent schema", () => {
  const schema = readJson(schemaPath);
  const commonSchema = readJson(commonSchemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(commonSchema, "eip.common.v1.schema.json");
  const validate = ajv.compile(schema);

  it("requires the AuditEvent v1 append-only contract fields", () => {
    expect(schema).toHaveProperty("required", [
      "schemaVersion",
      "id",
      "correlationId",
      "subject",
      "type",
      "actor",
      "occurredAt",
    ]);
    expect(schema).toHaveProperty("properties.causationId");
    expect(schema).toHaveProperty("properties.sequence");
    expect(schema).toHaveProperty("properties.severity");
    expect(schema).toHaveProperty("properties.payload");
    expect(schema).toHaveProperty("properties.dataClassification");
    expect(schema).toHaveProperty("properties.extensions");
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

  it("requires occurredAt and rejects legacy timestamp", () => {
    expect(validate(auditEvent({ occurredAt: undefined }))).toBe(false);
    expect(validate(auditEvent({ timestamp: "2026-04-29T03:20:00Z" }))).toBe(false);
  });

  it("requires dot-separated event type namespaces", () => {
    expect(validate(auditEvent({ type: "loop.run.requested" }))).toBe(true);
    expect(validate(auditEvent({ type: "loop-run-requested" }))).toBe(false);
  });
});

describe("EIP-0003 AuditEvent docs", () => {
  it("documents append-only usage, event registry, and payload secret safety", () => {
    const docs = readMarkdown("docs/EIP-0003-audit-event.md");

    expect(docs).toContain("append-only");
    expect(docs).toContain("Event Type Registry");
    expect(docs).toContain("must not carry raw secrets");
  });
});
