import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "schemas/eip.run-request.v1.schema.json");
const commonSchemaPath = path.join(repoRoot, "schemas/eip.common.v1.schema.json");
const validFixturesDir = path.join(repoRoot, "fixtures/run-request/v1/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/run-request/v1/invalid");

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

function runRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const fixture = readJson("fixtures/run-request/v1/valid/github-issue-request.json");

  return {
    ...(fixture as Record<string, unknown>),
    ...overrides,
  };
}

function containsRawSecret(value: unknown): boolean {
  if (typeof value === "string") {
    return /(ghp_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16})/.test(
      value
    );
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsRawSecret(item));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).some(
      ([key, nested]) =>
        /(?:secret|token|password|privateKey)/i.test(key) || containsRawSecret(nested)
    );
  }

  return false;
}

describe("EIP-0001 RunRequest schema", () => {
  const schema = readJson(schemaPath);
  const commonSchema = readJson(commonSchemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(commonSchema, "eip.common.v1.schema.json");
  const validate = ajv.compile(schema);

  it("requires the RunRequest v1 contract fields", () => {
    expect(schema).toHaveProperty("required", [
      "schemaVersion",
      "id",
      "correlationId",
      "idempotencyKey",
      "source",
      "requestedBy",
      "workItem",
      "mode",
      "createdAt",
    ]);
    expect(schema).toHaveProperty("properties.target");
    expect(schema).toHaveProperty("properties.policyContext");
    expect(schema).toHaveProperty("properties.dataClassification");
    expect(schema).toHaveProperty("properties.extensions");
  });

  it.each(fixturePaths(validFixturesDir))("accepts valid fixture %s", (fixturePath) => {
    const fixture = readJson(fixturePath);

    expect(containsRawSecret(fixture)).toBe(false);
    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it.each(fixturePaths(invalidFixturesDir))(
    "rejects invalid fixture %s",
    (fixturePath) => {
      const fixture = readJson(fixturePath);
      const hasRawSecret = containsRawSecret(fixture);
      const isSchemaValid = validate(fixture);

      if (path.basename(fixturePath) === "raw-secret.json") {
        expect(hasRawSecret).toBe(true);
      } else {
        expect(hasRawSecret).toBe(false);
        expect(isSchemaValid, JSON.stringify(validate.errors, null, 2)).toBe(false);
      }
    }
  );

  it("rejects unknown top-level fields", () => {
    expect(validate(runRequest({ unexpected: true }))).toBe(false);
  });

  it("requires source to be an object", () => {
    expect(validate(runRequest({ source: "github" }))).toBe(false);
  });

  it("uses workItem.externalId for external system identifiers", () => {
    const fixture = runRequest();

    expect(fixture.workItem).toHaveProperty("externalId", "4");
    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it("rejects raw secret fixture content with the fixture safety check", () => {
    const fixture = readJson("fixtures/run-request/v1/invalid/raw-secret.json");

    expect(containsRawSecret(fixture)).toBe(true);
  });
});

describe("EIP-0001 RunRequest docs", () => {
  it("documents idempotency behavior and fixture safety", () => {
    const docs = readMarkdown("docs/EIP-0001-run-request.md");

    expect(docs).toContain("idempotencyKey");
    expect(docs).toContain("Consumers should use the tuple");
    expect(docs).toContain("fail closed");
    expect(docs).toContain("Raw credentials");
  });
});
