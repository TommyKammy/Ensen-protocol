import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import { checkPublicFixtures } from "./check-public-fixtures.js";

export interface FixtureValidationCase {
  fixturePath: string;
  schemaPath: string;
  valid: boolean;
  expectedReason: string;
}

export interface FixtureValidationResult {
  ok: boolean;
  failures: string[];
  cases: FixtureValidationCase[];
}

const fixtureSuites = [
  {
    fixtureRoot: "common/v1",
    schemaPath: "schemas/eip.common.v1.schema.json",
    invalidReasons: new Map([
      ["bad-classification.json", "allowed values"],
      ["bad-extension-key.json", "property name"],
      ["bad-timestamp.json", "pattern"],
      ["missing-actor-binding.json", "required property 'actorId'"]
    ])
  },
  {
    fixtureRoot: "run-request/v1",
    schemaPath: "schemas/eip.run-request.v1.schema.json",
    invalidReasons: new Map([
      ["bad-schema-version.json", "const"],
      ["raw-secret.json", "sensitive key"],
      ["source-string.json", "must be object"],
      ["unknown-top-level-field.json", "additional properties"]
    ])
  },
  {
    fixtureRoot: "run-result/v1",
    schemaPath: "schemas/eip.run-result.v1.schema.json",
    invalidReasons: new Map([
      ["missing-request-id.json", "required property 'requestId'"],
      ["running-status.json", "allowed values"]
    ])
  },
  {
    fixtureRoot: "audit-event/v1",
    schemaPath: "schemas/eip.audit-event.v1.schema.json",
    invalidReasons: new Map([
      ["bad-event-type.json", "pattern"],
      ["forbidden-timestamp.json", "required property 'occurredAt'"]
    ])
  },
  {
    fixtureRoot: "evidence-bundle-ref/v1",
    schemaPath: "schemas/eip.evidence-bundle-ref.v1.schema.json",
    invalidReasons: new Map([
      ["bad-checksum.json", "allowed values"],
      ["raw-secret-uri.json", "credential-bearing URI"]
    ])
  },
  {
    fixtureRoot: "run-status/v1",
    schemaPath: "schemas/eip.run-status.v1.schema.json",
    invalidReasons: new Map([["final-result-only-fields.json", "additional properties"]])
  }
] as const;

function repoRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

function fixturePaths(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => path.join(directory, entry))
    .sort();
}

function allSchemaPaths(rootDir: string): string[] {
  return readdirSync(path.join(rootDir, "schemas"))
    .filter((entry) => entry.endsWith(".schema.json"))
    .map((entry) => path.join(rootDir, "schemas", entry))
    .sort();
}

function createAjv(rootDir: string): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: true });

  for (const schemaPath of allSchemaPaths(rootDir)) {
    const schema = readJson(schemaPath) as Record<string, unknown>;
    ajv.addSchema(schema, path.basename(schemaPath));
  }

  return ajv;
}

function caseList(rootDir: string): FixtureValidationCase[] {
  return fixtureSuites.flatMap((suite) => {
    const validCases = fixturePaths(path.join(rootDir, "fixtures", suite.fixtureRoot, "valid")).map(
      (fixturePath) => ({
        fixturePath,
        schemaPath: path.join(rootDir, suite.schemaPath),
        valid: true,
        expectedReason: "schema valid"
      })
    );

    const invalidCases = fixturePaths(path.join(rootDir, "fixtures", suite.fixtureRoot, "invalid")).map(
      (fixturePath) => ({
        fixturePath,
        schemaPath: path.join(rootDir, suite.schemaPath),
        valid: false,
        expectedReason: suite.invalidReasons.get(path.basename(fixturePath)) ?? "schema invalid"
      })
    );

    return [...validCases, ...invalidCases];
  });
}

function formatErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? ""}`.trim())
    .join("; ");
}

function compileBySchemaPath(ajv: Ajv2020, cases: FixtureValidationCase[]): Map<string, ValidateFunction> {
  const validators = new Map<string, ValidateFunction>();

  for (const schemaPath of new Set(cases.map((validationCase) => validationCase.schemaPath))) {
    const validate = ajv.getSchema(path.basename(schemaPath));

    if (validate) {
      validators.set(schemaPath, validate);
    }
  }

  return validators;
}

export function validateFixtures(rootDir: string = repoRoot()): FixtureValidationResult {
  const failures: string[] = [];
  const cases = caseList(rootDir);
  const ajv = createAjv(rootDir);
  const validators = compileBySchemaPath(ajv, cases);

  for (const validationCase of cases) {
    const fixture = readJson(validationCase.fixturePath);
    const validate = validators.get(validationCase.schemaPath);

    if (!validate) {
      failures.push(`${validationCase.fixturePath}: missing validator`);
      continue;
    }

    const schemaValid = validate(fixture);
    const safetyResult = checkPublicFixtures([validationCase.fixturePath]);
    const isValid = schemaValid && safetyResult.ok;
    const relativePath = path.relative(rootDir, validationCase.fixturePath);

    if (validationCase.valid && !isValid) {
      failures.push(
        `${relativePath}: expected valid, got ${formatErrors(validate.errors)} ${safetyResult.findings
          .map((finding) => finding.reason)
          .join("; ")}`
      );
    }

    if (!validationCase.valid && isValid) {
      failures.push(`${relativePath}: expected invalid for ${validationCase.expectedReason}`);
    }

    if (!validationCase.valid && !isValid) {
      const reasonText = `${formatErrors(validate.errors)} ${safetyResult.findings
        .map((finding) => finding.reason)
        .join("; ")}`;

      if (!reasonText.toLowerCase().includes(validationCase.expectedReason.toLowerCase())) {
        failures.push(
          `${relativePath}: expected invalid reason ${validationCase.expectedReason}, got ${reasonText}`
        );
      }
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    cases
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
    const result = validateFixtures(rootDir);

    if (!result.ok) {
      console.error(result.failures.join("\n"));
      process.exitCode = 1;
    }
  }
}
