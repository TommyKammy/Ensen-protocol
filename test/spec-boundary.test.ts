import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkSpecOnlyBoundary,
  disallowedRuntimeDirectories
} from "../scripts/check-spec-only-boundary";

const tempRoots: string[] = [];

function makeTempRepo(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "ensen-protocol-boundary-"));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();

    if (root) {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

describe("spec-only boundary", () => {
  it("passes when no runtime implementation directories exist", () => {
    const root = makeTempRepo();

    expect(checkSpecOnlyBoundary(root)).toEqual({
      ok: true,
      violations: []
    });
  });

  it.each(disallowedRuntimeDirectories)(
    "fails closed when %s exists",
    (runtimeDirectory) => {
      const root = makeTempRepo();
      mkdirSync(path.join(root, runtimeDirectory), { recursive: true });

      expect(checkSpecOnlyBoundary(root)).toEqual({
        ok: false,
        violations: [runtimeDirectory]
      });
    }
  );
});
