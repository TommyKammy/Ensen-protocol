# Versioning

EIP versioning protects interoperability between independently released Ensen
components.

- Contract-breaking changes require a new major protocol version.
- Backward-compatible additions may be introduced in a minor version.
- Editorial-only changes may be introduced in a patch version.
- Fixtures and schemas identify the protocol version they target through
  `schemaVersion`, schema filenames, and versioned fixture directories.

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
