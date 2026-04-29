import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "../test-support/assertions.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("repository baseline", () => {
  it("contains the expected spec baseline files", () => {
    const expectedPaths = [
      "README.md",
      "AGENTS.md",
      "package.json",
      "tsconfig.json",
      "docs/README.md",
      "docs/naming.md",
      "docs/versioning.md",
      "docs/compatibility.md",
      "docs/security.md",
      "schemas/README.md",
      "fixtures/README.md",
      "openapi/README.md",
      "scripts/check-spec-only-boundary.ts",
      "test/spec-boundary.test.ts",
      "test/smoke.test.ts"
    ];

    for (const relativePath of expectedPaths) {
      expect(existsSync(path.join(repoRoot, relativePath)), relativePath).toBe(true);
    }
  });
});
