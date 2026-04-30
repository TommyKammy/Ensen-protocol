# Versioning

EIP versioning protects interoperability between independently released Ensen
components.

- Contract-breaking changes require a new major protocol version.
- Backward-compatible additions may be introduced in a minor version.
- Editorial-only changes may be introduced in a patch version.
- Fixtures and schemas identify the protocol version they target through
  `schemaVersion`, schema filenames, and versioned fixture directories.

Consumers must fail closed when they encounter an unsupported EIP major version.
Unsupported EIP major version artifacts must be rejected or blocked until the
consumer has adopted a protocol snapshot that explicitly includes that major
version. Consumers must not silently accept, downgrade, coerce, or interpret the
artifact as a neighboring supported major version.

The first published protocol baseline is `v0.1.0`.

`v0.1.0` contains the v1 schema family and conformance fixture baseline:

- EIP-0000 Common Types
- EIP-0001 RunRequest
- EIP-0002 RunResult
- EIP-0003 AuditEvent
- EIP-0004 EvidenceBundleRef
- EIP-0005 RunStatusSnapshot
- EIP-0006 conformance fixture and public fixture safety tooling
- EIP-0007 Ensen-loop / Ensen-flow integration handoff notes

## Release Snapshot Handoff

Before publishing a protocol release for downstream consumers, run the snapshot
handoff check from `protocol-snapshot-policy.md`:

- record the protocol version and commit or tag selected for the release;
- name the schema families and fixture families included in the snapshot;
- name any intentionally excluded schema families or fixture families;
- confirm the consumer conformance checklist is linked for Loop, Flow, and
  future consumers;
- confirm unsupported EIP major version handling is covered by the consumer
  conformance evidence;
- record sanitized validation command evidence for `npm test`,
  `npm run check:fixtures`, `npm run check:public-fixtures`, and
  `npm run check:spec-boundary`.

The release snapshot remains a set of copied or vendored contract artifacts. It
does not create a runtime dependency on Ensen-protocol.
