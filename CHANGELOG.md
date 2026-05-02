# Changelog

## v0.2.0 - 2026-05-02

Phase 3 transport and capability contract snapshot.

- Added executor transport capability guidance for `submit`, `status`,
  `cancel`, `fetchEvidence`, polling support, evidence reference support, and
  idempotency expectations.
- Added operation lifecycle guidance for submit/status/cancel/fetchEvidence,
  including polling behavior, terminal-state handoff, and unsupported or partial
  capability handling.
- Added transport error mapping and retryability guidance for validation
  failures, unsupported capabilities, transient transport failures, provider
  failures, cancellation outcomes, evidence-unavailable outcomes, and
  unsupported EIP major versions.
- Added capability variant examples for fully supported, submit-only,
  unsupported-cancel, evidence-unavailable, and retryability scenarios.
- Added docs regression coverage for the Phase 3 guidance and capability
  variant examples.
- Preserved the spec-only boundary: no runtime server, SDK, connector
  implementation, workflow runtime, or OpenAPI transport API is introduced by
  this release.

## v0.1.0 - 2026-04-29

Initial Ensen Interop Protocol baseline.

- Added spec-only repository boundary and validation tooling.
- Added Common Types v1.
- Added RunRequest v1, RunResult v1, AuditEvent v1, EvidenceBundleRef v1, and RunStatusSnapshot v1 schemas.
- Added valid and invalid conformance fixtures.
- Added public fixture safety, schema ID, fixture validation, and spec-only boundary checks.
- Added Ensen-loop and Ensen-flow integration handoff notes.
- Aligned ActorRef actor types, public ID prefixes, and the test runner policy after Phase 1 review.
