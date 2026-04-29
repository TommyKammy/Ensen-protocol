# Ensen-protocol

Ensen Interop Protocol (EIP) is a public contract for interoperability between
Ensen-loop, Ensen-flow, domain-specific Ensen-flow variants, future executors,
and connector implementations.

This repository is a specification repository. It defines contract documents,
schemas, examples, and compatibility rules. It is not a runtime implementation,
executor, workflow engine, connector package, or loop service.

## Repository Shape

- `docs/` contains protocol guidance and design rules.
- `schemas/` is reserved for versioned machine-readable contract schemas.
- `fixtures/` is reserved for example inputs and outputs used to test contracts.
- `openapi/` is reserved for future transport-level API descriptions.
- `scripts/check-spec-only-boundary.ts` enforces that runtime implementation
  directories are not added to this repository.

Runtime code belongs in implementation repositories. This repository should stay
focused on the EIP contract and publishable specification assets.

## Verification

```sh
npm install
npm test
```
