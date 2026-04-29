# Repository Guidance

This repository is spec-only. Keep contributions focused on EIP contract text,
schemas, fixtures, compatibility guidance, and validation scripts.

Before implementing a change, preserve the Ensen development charter: protocol
over shared implementation, bounded execution, evidence before authority, and
no premature compliance claims.

Do not add runtime implementation directories such as `src/runtime`,
`src/workflow`, `src/loop`, or `src/connectors`. If implementation code is
needed, place it in the relevant Ensen runtime repository instead.

Use repo-relative commands in durable documentation:

```sh
npm install
npm test
```
