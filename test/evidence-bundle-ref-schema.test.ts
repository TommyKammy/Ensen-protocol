import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(repoRoot, "schemas/eip.evidence-bundle-ref.v1.schema.json");
const commonSchemaPath = path.join(repoRoot, "schemas/eip.common.v1.schema.json");
const validFixturesDir = path.join(repoRoot, "fixtures/evidence-bundle-ref/v1/valid");
const invalidFixturesDir = path.join(repoRoot, "fixtures/evidence-bundle-ref/v1/invalid");

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

function evidenceBundleRef(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const fixture = readJson("fixtures/evidence-bundle-ref/v1/valid/local-path.json");

  return {
    ...(fixture as Record<string, unknown>),
    ...overrides
  };
}

function containsRawSecretUri(value: unknown): boolean {
  if (typeof value === "string") {
    return /^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#\s]*[^/?#\s:@]+:[^/?#\s:@]+@/.test(
      value
    );
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsRawSecretUri(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((nested) => containsRawSecretUri(nested));
  }

  return false;
}

describe("EIP-0004 EvidenceBundleRef schema", () => {
  const schema = readJson(schemaPath);
  const commonSchema = readJson(commonSchemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(commonSchema, "eip.common.v1.schema.json");
  const validate = ajv.compile(schema);
  const hostLocalPath = path.posix.join(
    "/",
    "Users",
    "example",
    "evidence",
    "bundle.json"
  );

  it("requires the EvidenceBundleRef v1 contract fields", () => {
    expect(schema).toHaveProperty("required", [
      "schemaVersion",
      "id",
      "correlationId",
      "type",
      "uri",
      "createdAt"
    ]);
    expect(schema).toHaveProperty("properties.contentType");
    expect(schema).toHaveProperty("properties.checksum");
    expect(schema).toHaveProperty("properties.metadata");
  });

  it.each(fixturePaths(validFixturesDir))("accepts valid fixture %s", (fixturePath) => {
    const fixture = readJson(fixturePath);

    expect(containsRawSecretUri(fixture)).toBe(false);
    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it.each(fixturePaths(invalidFixturesDir))(
    "rejects invalid fixture %s",
    (fixturePath) => {
      const fixture = readJson(fixturePath);

      expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(false);
    }
  );

  it("supports only sha256 checksums initially", () => {
    expect(
      validate(
        evidenceBundleRef({
          checksum: {
            algorithm: "sha256",
            value: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
          }
        })
      ),
      JSON.stringify(validate.errors, null, 2)
    ).toBe(true);

    expect(
      validate(
        evidenceBundleRef({
          checksum: {
            algorithm: "sha512",
            value: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
          }
        })
      )
    ).toBe(false);
  });

  it("rejects URI credentials and host-local absolute local paths", () => {
    expect(
      validate(
        evidenceBundleRef({
          type: "file_uri",
          uri: "https://user:REDACTED_FIXTURE_SECRET_PLACEHOLDER@evidence.example.test/bundle.json"
        })
      )
    ).toBe(false);
    expect(
      containsRawSecretUri(
        readJson("fixtures/evidence-bundle-ref/v1/invalid/raw-secret-uri.json")
      )
    ).toBe(true);

    expect(
      validate(
        evidenceBundleRef({
          type: "local_path",
          uri: hostLocalPath
        })
      )
    ).toBe(false);
  });
});

describe("EIP-0004 EvidenceBundleRef docs", () => {
  it("documents reference-only semantics and local path versus file URI usage", () => {
    const docs = readMarkdown("docs/EIP-0004-evidence-bundle-ref.md");

    expect(docs).toContain("not the evidence bundle body");
    expect(docs).toContain("local_path");
    expect(docs).toContain("file_uri");
    expect(docs).toContain("must not contain credentials");
  });
});
