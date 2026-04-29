# Repository Guidance

This repository is spec-only. Keep contributions focused on EIP contract text,
schemas, fixtures, compatibility guidance, and validation scripts.

Do not add runtime implementation directories such as `src/runtime`,
`src/workflow`, `src/loop`, or `src/connectors`. If implementation code is
needed, place it in the relevant Ensen runtime repository instead.

Use repo-relative commands in durable documentation:

```sh
npm install
npm test
```
