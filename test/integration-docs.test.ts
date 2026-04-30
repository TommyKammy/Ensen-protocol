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
    expect(checklist).toMatch(/\bEnsen-loop\b/i);
    expect(checklist).toMatch(/\bEnsen-flow\b/i);
    expect(checklist).toMatch(/sanitized/i);
    expect(hasWorkstationHomePath(checklist)).toBe(false);
    expect(docsIndex).toContain(
      "integration/consumer-conformance-handoff-checklist.md"
    );
  });

  it("documents protocol snapshot policy and release handoff checks", () => {
    const policy = readDoc("docs/protocol-snapshot-policy.md");
    const checklist = readDoc(
      "docs/integration/consumer-conformance-handoff-checklist.md"
    );
    const versioning = readDoc("docs/versioning.md");
    const docsIndex = readDoc("docs/README.md");

    for (const expected of [
      "release or tagged contract artifacts",
      "not a runtime dependency",
      "protocol version",
      "commit or tag",
      "schema families",
      "fixture families",
      "validation commands",
      "copy or vendor",
      "protocol follow-up issue",
      "Ensen-loop",
      "Ensen-flow"
    ]) {
      expect(policy).toContain(expected);
    }

    expect(policy).toMatch(/npm test/);
    expect(policy).toMatch(/npm run check:fixtures/);
    expect(policy).toMatch(/npm run check:public-fixtures/);
    expect(policy).toMatch(/npm run check:spec-boundary/);
    expect(hasWorkstationHomePath(policy)).toBe(false);

    for (const doc of [checklist, versioning, docsIndex]) {
      expect(doc).toContain("protocol-snapshot-policy.md");
    }
  });

  it("documents unsupported EIP major version fail-closed behavior", () => {
    const policy = readDoc("docs/protocol-snapshot-policy.md");
    const checklist = readDoc(
      "docs/integration/consumer-conformance-handoff-checklist.md"
    );
    const loopGuide = readDoc("docs/integration/ensen-loop-consumer-guide.md");
    const flowGuide = readDoc("docs/integration/ensen-flow-consumer-guide.md");
    const versioning = readDoc("docs/versioning.md");

    for (const doc of [policy, checklist, loopGuide, flowGuide, versioning]) {
      expect(doc).toMatch(/unsupported EIP major version/i);
      expect(doc).toMatch(/fail closed/i);
      expect(hasWorkstationHomePath(doc)).toBe(false);
    }

    expect(checklist).toContain("unsupported-major-version rejection");
    expect(checklist).toContain("consumer boundary that rejected the artifact");
    expect(policy).toContain("unsupported EIP major version evidence");
    expect(policy).toContain("unsupported EIP major version, the consumer boundary");
    expect(policy).toContain("local check or test command");
    expect(loopGuide).toMatch(/loop\s+boundary that blocked it/);
    expect(loopGuide).toContain("`parser` or `executor-dispatch`");
    expect(flowGuide).toMatch(/flow\s+boundary that blocked it/);
    expect(flowGuide).toContain("`parser`, `authoring`, or `ingestion`");
    expect(policy).toContain(
      "integration/consumer-conformance-handoff-checklist.md"
    );
  });

  it("documents the X-Gate 2 loop-flow dry-run smoke fixture contract", () => {
    const fixturesReadme = readDoc("fixtures/README.md");

    for (const expected of [
      "X-Gate 2",
      "RunRequest -> RunStatusSnapshot -> RunResult -> EvidenceBundleRef",
      "0.1.x protocol snapshot",
      "schemas/eip.run-request.v1.schema.json",
      "schemas/eip.run-status.v1.schema.json",
      "schemas/eip.run-result.v1.schema.json",
      "schemas/eip.evidence-bundle-ref.v1.schema.json",
      "fixtures/run-request/v1/",
      "fixtures/run-status/v1/",
      "fixtures/run-result/v1/",
      "fixtures/evidence-bundle-ref/v1/",
      "vendor or copy release snapshots",
      "protocol gap",
      "loop gap",
      "flow gap",
      "Ensen-flow X-Gate 2 CLI-backed smoke issue",
      "Ensen-loop X-Gate 2 dry-run output issue"
    ]) {
      expect(fixturesReadme).toContain(expected);
    }

    expect(fixturesReadme).toMatch(
      /no runtime package,\s+server,\s+SDK,\s+connector,\s+or shared implementation/i
    );
    expect(fixturesReadme).toMatch(/raw secret/i);
    expect(fixturesReadme).toMatch(/token/i);
    expect(fixturesReadme).toMatch(/customer data/i);
    expect(fixturesReadme).toMatch(/real repository mutation/i);
    expect(fixturesReadme).toMatch(/workstation-local path/i);
    expect(hasWorkstationHomePath(fixturesReadme)).toBe(false);
  });
});
