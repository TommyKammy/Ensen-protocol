# Fixtures

This directory is reserved for EIP contract fixtures.

Fixtures should be minimal examples that prove protocol behavior. Use
placeholders for credentials, tenants, hosts, and operator-specific values.

- `common/v1/valid/` contains valid EIP-0000 common type fixtures.
- `common/v1/invalid/` contains negative fixtures that must fail validation.
- `run-request/v1/valid/` contains valid EIP-0001 RunRequest fixtures.
- `run-request/v1/invalid/` contains negative RunRequest fixtures and fixture
  safety examples.
- `run-result/v1/valid/` contains valid EIP-0002 RunResult fixtures.
- `run-result/v1/invalid/` contains negative RunResult fixtures.
- `audit-event/v1/valid/` contains valid EIP-0003 AuditEvent fixtures.
- `audit-event/v1/invalid/` contains negative AuditEvent fixtures.
- `evidence-bundle-ref/v1/valid/` contains valid EIP-0004 EvidenceBundleRef
  fixtures.
- `evidence-bundle-ref/v1/invalid/` contains negative EvidenceBundleRef
  fixtures.
- `run-status/v1/valid/` contains valid EIP-0005 RunStatusSnapshot fixtures.
- `run-status/v1/invalid/` contains negative RunStatusSnapshot fixtures.

## X-Gate 2 Loop-Flow Dry-Run Smoke

X-Gate 2 uses this public fixture suite to align the narrow loop-flow dry-run
smoke path across Ensen-flow and Ensen-loop:

```text
RunRequest -> RunStatusSnapshot -> RunResult -> EvidenceBundleRef
```

The expected consumer snapshot is the `0.1.x protocol snapshot`. Flow and Loop
must vendor or copy release snapshots of the protocol artifacts into their own
consumer test trees. Ensen-protocol provides no runtime package, server, SDK,
connector, or shared implementation for this smoke path.

Use these EIP artifacts for the smoke contract:

| Smoke artifact | Contract source | Fixture source |
| --- | --- | --- |
| RunRequest v1 | `schemas/eip.run-request.v1.schema.json` | `fixtures/run-request/v1/` |
| RunStatusSnapshot v1 | `schemas/eip.run-status.v1.schema.json` | `fixtures/run-status/v1/` |
| RunResult v1 | `schemas/eip.run-result.v1.schema.json` | `fixtures/run-result/v1/` |
| EvidenceBundleRef v1 | `schemas/eip.evidence-bundle-ref.v1.schema.json` | `fixtures/evidence-bundle-ref/v1/` |

Public smoke examples must stay synthetic and publishable. They must not include
raw secret values, token values, customer data, real repository mutation
payloads, or workstation-local path values. Use placeholders such as
`<tenant-id>`, `<credential-ref>`, `<repository-ref>`, `<evidence-root>`, and
`<supervisor-config-path>` when the smoke example needs to name a boundary
without exposing local or private state.

Route X-Gate 2 failures by ownership:

- protocol gap: the EIP schema, fixture path, fixture safety rule, compatibility
  guidance, or snapshot-copy policy is ambiguous or missing in Ensen-protocol.
- loop gap: Ensen-loop cannot consume the copied snapshot, emit the expected
  dry-run `RunStatusSnapshot` or `RunResult`, or reference an
  `EvidenceBundleRef` without redefining the protocol contract.
- flow gap: Ensen-flow cannot build the CLI-backed smoke request, preserve the
  copied protocol snapshot, or classify the dry-run result without redefining
  the protocol contract.

Downstream X-Gate 2 issues should point back to these fixture expectations:

- [Ensen-flow X-Gate 2 CLI-backed smoke issue](https://github.com/TommyKammy/Ensen-flow/issues/37)
- [Ensen-loop X-Gate 2 dry-run output issue](https://github.com/TommyKammy/Ensen-loop/issues/35)
