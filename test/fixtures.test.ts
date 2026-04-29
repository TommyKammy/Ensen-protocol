import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateFixtures } from "../scripts/validate-fixtures.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
});
