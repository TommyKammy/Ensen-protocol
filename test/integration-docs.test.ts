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
      "v0.1.0",
      "43fa3e7",
      "schemas/eip.run-request.v1.schema.json",
      "schemas/eip.run-status.v1.schema.json",
      "schemas/eip.run-result.v1.schema.json",
      "schemas/eip.evidence-bundle-ref.v1.schema.json",
      "fixtures/run-request/v1/",
      "fixtures/run-status/v1/",
      "fixtures/run-result/v1/",
      "fixtures/evidence-bundle-ref/v1/",
      "protocol gap",
      "loop gap",
      "flow gap",
      "Ensen-flow X-Gate 2 CLI-backed smoke issue",
      "Ensen-loop X-Gate 2 dry-run output issue"
    ]) {
      expect(fixturesReadme).toContain(expected);
    }

    expect(fixturesReadme).toMatch(
      /no runtime package,\s+server,\s+SDK,\s+connector,\s+or shared\s+implementation/i
    );
    expect(fixturesReadme).toMatch(/vendor or copy that immutable release\s+snapshot/i);
    expect(fixturesReadme).toMatch(/raw secret/i);
    expect(fixturesReadme).toMatch(/token/i);
    expect(fixturesReadme).toMatch(/customer data/i);
    expect(fixturesReadme).toMatch(/real repository mutation/i);
    expect(fixturesReadme).toMatch(/workstation-local path/i);
    expect(hasWorkstationHomePath(fixturesReadme)).toBe(false);
  });

  it("documents post-gate protocol gap and conformance drift routing", () => {
    const routingGuide = readDoc(
      "docs/integration/protocol-gap-and-conformance-drift.md"
    );
    const docsIndex = readDoc("docs/README.md");

    for (const expected of [
      "post-gate drift routing",
      "X-Gate 2 loop-flow dry-run smoke path has already been reached",
      "does not reopen that reached decision",
      "protocol snapshot version",
      "failing consumer repo",
      "observed artifact",
      "expected artifact",
      "reproduction boundary",
      "sanitized artifact references",
      "protocol gap",
      "loop gap",
      "flow gap",
      "schema/spec ambiguity",
      "fixture drift",
      "consumer implementation bug",
      "unsupported EIP major version",
      "fail closed",
      "fixtures/README.md",
      "protocol-snapshot-policy.md",
      "consumer-conformance-handoff-checklist.md"
    ]) {
      expect(routingGuide).toContain(expected);
    }

    for (const forbidden of [
      /raw secret/i,
      /token/i,
      /customer data/i,
      /real repository mutation/i,
      /workstation-local path/i
    ]) {
      expect(routingGuide).toMatch(forbidden);
    }

    expect(hasWorkstationHomePath(routingGuide)).toBe(false);
    expect(docsIndex).toContain(
      "integration/protocol-gap-and-conformance-drift.md"
    );
  });

  it("documents executor transport capability vocabulary", () => {
    const capabilityModel = readDoc(
      "docs/integration/executor-transport-capabilities.md"
    );
    const docsIndex = readDoc("docs/README.md");

    for (const expected of [
      "executor transport capability model",
      "transport-neutral",
      "submit",
      "status",
      "cancel",
      "fetchEvidence",
      "polling support",
      "evidence reference support",
      "idempotency expectation",
      "unsupported-operation behavior",
      "required baseline",
      "optional",
      "partial",
      "unsupported",
      "Flow connector capability matrix",
      "Loop provider boundary",
      "RunRequest",
      "RunStatusSnapshot",
      "RunResult",
      "EvidenceBundleRef",
      "protocol gap",
      "conformance drift",
      "fail closed"
    ]) {
      expect(capabilityModel).toContain(expected);
    }

    expect(capabilityModel).toMatch(/must not define OpenAPI endpoints/i);
    expect(capabilityModel).toMatch(/must not require SDK/i);
    expect(hasWorkstationHomePath(capabilityModel)).toBe(false);
    expect(docsIndex).toContain(
      "integration/executor-transport-capabilities.md"
    );
  });

  it("documents executor operation lifecycle semantics", () => {
    const lifecycle = readDoc(
      "docs/integration/executor-operation-lifecycle.md"
    );
    const docsIndex = readDoc("docs/README.md");

    for (const expected of [
      "submit lifecycle",
      "status lifecycle",
      "cancel lifecycle",
      "fetchEvidence lifecycle",
      "RunRequest",
      "RunStatusSnapshot",
      "RunResult",
      "EvidenceBundleRef",
      "correlationId",
      "idempotencyKey",
      "required baseline",
      "optional",
      "partial",
      "unsupported",
      "best-effort",
      "reference retrieval",
      "executor-transport-capabilities.md",
      "protocol-gap-and-conformance-drift.md",
      "schema/spec ambiguity"
    ]) {
      expect(lifecycle).toContain(expected);
    }

    expect(lifecycle).toMatch(/must not define OpenAPI endpoints/i);
    expect(lifecycle).toMatch(/must not require SDK/i);
    expect(lifecycle).toMatch(/do not embed evidence bodies/i);
    expect(hasWorkstationHomePath(lifecycle)).toBe(false);
    expect(docsIndex).toContain(
      "integration/executor-operation-lifecycle.md"
    );
  });
});
