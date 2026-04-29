import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020, type AnySchema } from "ajv/dist/2020.js";
import { describe, expect, it } from "../test-support/assertions.js";

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

function commonEnvelope(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const fixture = readJson("fixtures/common/v1/valid/common-envelope.json");

  return {
    ...(fixture as Record<string, unknown>),
    ...overrides,
  };
}

describe("EIP-0000 common schema", () => {
  const schema = readJson(schemaPath) as AnySchema;
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

  it.each([
    "2026-04-29T01:00:00Z",
    "2026-04-29T01:00:00.1Z",
    "2026-04-29T01:00:00.123456Z",
  ])("accepts UTC timestamps with optional fractional seconds: %s", (createdAt) => {
    expect(
      validate(commonEnvelope({ createdAt })),
      JSON.stringify(validate.errors, null, 2)
    ).toBe(true);
  });

  it.each(["2026-04-29T01:00:00.Z", "2026-04-29T01:00:00.123456+00:00"])(
    "rejects malformed or non-Z UTC timestamps: %s",
    (createdAt) => {
      expect(validate(commonEnvelope({ createdAt }))).toBe(false);
    }
  );

  it.each(["req_", "run_", "sts_", "evt_", "evb_", "corr_"])(
    "accepts canonical short semantic PrefixedId prefix: %s",
    (prefix) => {
      expect(
        validate(commonEnvelope({ artifactId: `${prefix}01HV9ZX8J2K6T3QW4R5Y7M8N9A` })),
        JSON.stringify(validate.errors, null, 2)
      ).toBe(true);
    }
  );

  it.each(["runreq_", "runresult_", "runstatus_", "auditevent_", "evidencebundle_", "executor-run_"])(
    "rejects non-canonical drifted PrefixedId prefix: %s",
    (prefix) => {
      expect(
        validate(commonEnvelope({ artifactId: `${prefix}01HV9ZX8J2K6T3QW4R5Y7M8N9A` }))
      ).toBe(false);
    }
  );

  it.each(["human", "workflow", "system", "api_client", "connector", "executor", "agent"])(
    "accepts design-listed ActorRef actorType: %s",
    (actorType) => {
      expect(
        validate(
          commonEnvelope({
            actor: {
              actorId: "actor_01HV9ZX8J2K6T3QW4R5Y7M8N9A",
              actorType,
            },
          })
        ),
        JSON.stringify(validate.errors, null, 2)
      ).toBe(true);
    }
  );

  it.each(["service", "workflow-engine", "apiClient", ""])(
    "rejects malformed or non-design ActorRef actorType: %s",
    (actorType) => {
      expect(
        validate(
          commonEnvelope({
            actor: {
              actorId: "actor_01HV9ZX8J2K6T3QW4R5Y7M8N9A",
              actorType,
            },
          })
        )
      ).toBe(false);
    }
  );

  it("accepts any non-empty extension key that starts with x-", () => {
    const fixture = commonEnvelope({
      extensions: {
        "x-Vendor.Field": "extension values are artifact-specific",
      },
    });

    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it.each(["x-", "fixture-note"])(
    "rejects extension keys that do not use a non-empty x- prefix: %s",
    (key) => {
      const fixture = commonEnvelope({
        extensions: {
          [key]: "invalid extension key",
        },
      });

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
