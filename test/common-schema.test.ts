import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "schemas/eip.common.v1.schema.json");
const validFixturesDir = path.join(repoRoot, "fixtures/common/v1/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/common/v1/invalid");

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

describe("EIP-0000 common schema", () => {
  const schema = readJson(schemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);

  it("defines the required common v1 types", () => {
    expect(schema).toHaveProperty("$defs.PrefixedId");
    expect(schema).toHaveProperty("$defs.CorrelationId");
    expect(schema).toHaveProperty("$defs.IsoDateTimeUtc");
    expect(schema).toHaveProperty("$defs.ActorRef");
    expect(schema).toHaveProperty("$defs.SourceRef");
    expect(schema).toHaveProperty("$defs.WorkItemRef");
    expect(schema).toHaveProperty("$defs.ChangeRequestRef");
    expect(schema).toHaveProperty("$defs.EvidenceBundleRef");
    expect(schema).toHaveProperty("$defs.ErrorInfo");
    expect(schema).toHaveProperty("$defs.ExtensionMap");
    expect(schema).toHaveProperty("$defs.DataClassification");
  });

  it.each(fixturePaths(validFixturesDir))("accepts valid fixture %s", (fixturePath) => {
    const fixture = readJson(fixturePath);

    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it.each(fixturePaths(invalidFixturesDir))(
    "rejects invalid fixture %s",
    (fixturePath) => {
      const fixture = readJson(fixturePath);

      expect(validate(fixture)).toBe(false);
    }
  );
});

describe("EIP-0000 common docs", () => {
  it("documents id, timestamp, and data classification conventions", () => {
    const commonTypes = readMarkdown("docs/EIP-0000-common-types.md");
    const dataClassification = readMarkdown("docs/data-classification.md");
    const idempotency = readMarkdown("docs/idempotency.md");

    expect(commonTypes).toContain("artifact id");
    expect(commonTypes).toContain("reference IDs");
    expect(commonTypes).toContain("timestamp");
    expect(commonTypes).toContain("eventId");
    expect(commonTypes).toContain("artifact-specific primary ID aliases");
    expect(dataClassification).toContain("public fixture data");
    expect(dataClassification).toContain("production message data");
    expect(idempotency).toContain("CorrelationId");
  });
});
