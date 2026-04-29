import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "../test-support/assertions.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as Record<
    string,
    unknown
  >;
}

describe("Phase 1 test runner policy", () => {
  it("uses node --test with tsx and does not depend on a third-party runner", () => {
    const packageJson = readJson("package.json");
    const scripts = packageJson.scripts as Record<string, string>;
    const devDependencies = packageJson.devDependencies as Record<string, string>;

    expect(scripts.test).toBe("node --import tsx --test");
    expect(Object.keys(devDependencies)).toEqual(["@types/node", "ajv", "tsx", "typescript"]);
  });
});
