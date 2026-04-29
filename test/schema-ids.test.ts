import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkSchemaIds } from "../scripts/check-schema-ids.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("schema $id checks", () => {
  it("requires every schema $id to be present and unique", () => {
    const result = checkSchemaIds(repoRoot);

    expect(result.errors).toEqual([]);
    expect([...result.ids.keys()].sort()).toEqual([
      "https://eip.ensen.dev/schemas/eip.audit-event.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.common.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.evidence-bundle-ref.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.run-request.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.run-result.v1.schema.json",
      "https://eip.ensen.dev/schemas/eip.run-status.v1.schema.json"
    ]);
  });
});
