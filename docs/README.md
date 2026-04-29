# EIP Documentation

The `docs/` directory contains human-readable protocol guidance for Ensen
Interop Protocol.

EIP documentation defines contract expectations between producers, executors,
connectors, and downstream consumers. It does not define a runtime service or
implementation package.

Start here:

- `naming.md` defines naming conventions for protocol assets.
- `versioning.md` defines versioning expectations.
- `compatibility.md` defines compatibility and deprecation rules.
- `conformance.md` defines fixture validation and vendoring guidance.
- `integration/ensen-loop-consumer-guide.md` defines loop-side protocol
  consumption and fixture handoff guidance.
- `integration/ensen-flow-consumer-guide.md` defines flow-side protocol
  consumption and fixture handoff guidance.
- `integration/cross-repo-change-policy.md` defines the protocol-first
  cross-repo change process.
- `security.md` defines security posture for protocol artifacts.
- `EIP-0000-common-types.md` defines common v1 schema types.
- `EIP-0001-run-request.md` defines the RunRequest v1 executor request
  contract.
- `EIP-0002-run-result.md` defines the RunResult v1 terminal result contract.
- `EIP-0003-audit-event.md` defines the AuditEvent v1 append-only audit event
  contract.
- `EIP-0004-evidence-bundle-ref.md` defines the EvidenceBundleRef v1 evidence
  reference contract.
- `EIP-0005-run-status-snapshot.md` defines the RunStatusSnapshot v1 async
  executor polling contract.
- `data-classification.md` defines fixture and production data handling labels.
- `idempotency.md` defines common correlation and retry conventions.
