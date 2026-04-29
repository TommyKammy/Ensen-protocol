import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkPublicFixtures,
  publicFixturePaths
} from "../scripts/check-public-fixtures.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function withTempFixture(value: unknown, assertion: (filePath: string) => void): void {
  const tempDir = mkdtempSync(path.join(tmpdir(), "ensen-fixture-"));
  const filePath = path.join(tempDir, "fixture.json");

  try {
    writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
    assertion(filePath);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

describe("public fixture safety", () => {
  it("accepts publishable valid fixtures", () => {
    const fixturePaths = publicFixturePaths(repoRoot);
    expect(fixturePaths.length).toBeGreaterThan(0);
    const result = checkPublicFixtures(fixturePaths);

    expect(result.findings).toEqual([]);
  });

  it("rejects likely secrets by value and sensitive key", () => {
    withTempFixture(
      {
        schemaVersion: "fixture.test",
        token: "ghp_0123456789abcdefghijklmnopqrstuvwxyz"
      },
      (filePath) => {
        const result = checkPublicFixtures([filePath]);

        expect(result.ok).toBe(false);
        expect(result.findings.map((finding) => finding.reason)).toContain(
          "sensitive key name: token"
        );
        expect(result.findings.map((finding) => finding.reason)).toContain("GitHub token literal");
      }
    );
  });

  it("rejects customer-specific values and workstation-local absolute paths", () => {
    withTempFixture(
      {
        tenant: "acme-production",
        evidencePath: ["", "Users", "example", "operator", "private-fixture.json"].join("/")
      },
      (filePath) => {
        const result = checkPublicFixtures([filePath]);

        expect(result.ok).toBe(false);
        expect(result.findings.map((finding) => finding.reason)).toContain(
          "customer-specific value"
        );
        expect(result.findings.map((finding) => finding.reason)).toContain(
          "workstation-local absolute path"
        );
      }
    );
  });

  it("rejects fixture safety negative examples when checked directly", () => {
    const result = checkPublicFixtures([
      path.join(repoRoot, "fixtures/run-request/v1/invalid/raw-secret.json"),
      path.join(repoRoot, "fixtures/evidence-bundle-ref/v1/invalid/raw-secret-uri.json")
    ]);

    expect(result.ok).toBe(false);
    expect(result.findings.map((finding) => finding.reason)).toEqual(
      expect.arrayContaining(["sensitive key name: x-raw-secret", "credential-bearing URI"])
    );
  });
});
