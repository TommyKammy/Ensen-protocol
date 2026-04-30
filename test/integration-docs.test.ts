import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "../test-support/assertions.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workstationHomePathFragments = [
  ["/", "Users", "/"].join(""),
  ["/", "home", "/"].join(""),
  ["C:", "\\", "Users", "\\"].join("")
];

function readDoc(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function hasWorkstationHomePath(content: string): boolean {
  return workstationHomePathFragments.some((fragment) =>
    content.includes(fragment)
  );
}

describe("integration handoff documentation", () => {
  it("detects common workstation home path fragments", () => {
    expect(
      hasWorkstationHomePath(["/", "home", "/", "operator", "/", "repo"].join(""))
    ).toBe(true);
  });

  it("documents loop and flow as independent protocol consumers", () => {
    const loopGuide = readDoc("docs/integration/ensen-loop-consumer-guide.md");
    const flowGuide = readDoc("docs/integration/ensen-flow-consumer-guide.md");

    for (const guide of [loopGuide, flowGuide]) {
      expect(guide).toMatch(/must not import .*implementation/i);
      expect(guide).toMatch(/vendor|copy/i);
      expect(guide).toMatch(/fixtures?/i);
      expect(guide).toContain("| Artifact |");
      expect(hasWorkstationHomePath(guide)).toBe(false);
    }
  });

  it("defines protocol-first cross-repo change flow", () => {
    const policy = readDoc("docs/integration/cross-repo-change-policy.md");

    expect(policy).toMatch(/protocol issue first/i);
    expect(policy).toMatch(/Ensen-loop/i);
    expect(policy).toMatch(/Ensen-flow/i);
    expect(policy).toMatch(/must not import .*implementation/i);
    expect(hasWorkstationHomePath(policy)).toBe(false);
  });

  it("documents consumer conformance handoff evidence", () => {
    const checklist = readDoc(
      "docs/integration/consumer-conformance-handoff-checklist.md"
    );
    const docsIndex = readDoc("docs/README.md");

    for (const expected of [
      "protocol snapshot version",
      "copied schema paths",
      "copied fixture paths",
      "consumer conformance command evidence",
      "RunRequest",
      "RunStatusSnapshot",
      "RunResult",
      "AuditEvent",
      "EvidenceBundleRef",
      "contract repository",
      "not a runtime dependency",
      "protocol ambiguity"
    ]) {
      expect(checklist).toContain(expected);
    }

    expect(checklist).toMatch(/Ensen-protocol first/i);
    expect(checklist).toMatch(/Ensen-loop|Loop/i);
    expect(checklist).toMatch(/Ensen-flow|Flow/i);
    expect(checklist).toMatch(/sanitized/i);
    expect(hasWorkstationHomePath(checklist)).toBe(false);
    expect(docsIndex).toContain(
      "integration/consumer-conformance-handoff-checklist.md"
    );
  });
});
