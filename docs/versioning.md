# Versioning

EIP versioning protects interoperability between independently released Ensen
components.

- Contract-breaking changes require a new major protocol version.
- Backward-compatible additions may be introduced in a minor version.
- Editorial-only changes may be introduced in a patch version.
- Fixtures and schemas should identify the protocol version they target once
  versioned artifacts are introduced.

Until the first published protocol version is defined, this repository uses
`0.0.0` package metadata as a baseline placeholder.
