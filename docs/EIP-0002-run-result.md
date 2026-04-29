# EIP-0002 RunResult v1

RunResult v1 defines the transport-neutral terminal result artifact produced
after an Ensen-compatible executor finishes a run. The machine-readable schema
lives in `schemas/eip.run-result.v1.schema.json`.

RunResult is a contract document, not an async polling API, queue state format,
runtime service, connector implementation, or workflow engine.

## Required Fields

- `schemaVersion`: must be `eip.run-result.v1`.
- `id`: the RunResult artifact id.
- `requestId`: the RunRequest artifact id this result completes.
- `correlationId`: shared tracing and retry correlation id.
- `status`: final run status.
- `completedAt`: UTC completion time for the result artifact.

## Final Statuses

RunResult only represents final statuses:

- `succeeded`: the run completed successfully.
- `failed`: the run attempted work and failed.
- `blocked`: the run stopped because a required prerequisite was missing.
- `needs_review`: the run completed but requires human review before the
  downstream outcome can be trusted or applied.
- `cancelled`: the run was intentionally stopped before completion.

The in-progress states `queued` and `running` are not valid RunResult statuses.
Producers that need to expose those states should use a RunStatusSnapshot
artifact instead of emitting a RunResult early.

## Optional Fields

- `changeRequests`: zero or more common v1 ChangeRequestRef objects produced or
  updated by the run.
- `evidenceBundles`: zero or more common v1 EvidenceBundleRef objects that
  anchor logs, test results, review evidence, or other durable proof.
- `verification`: summary of verification commands and their outcomes.
- `errors`: machine-readable errors using the common v1 ErrorInfo shape.
- `warnings`: non-fatal diagnostics.
- `metrics`: bounded run metrics such as duration, attempts, and token counts.
- `extensions`: `x-` prefixed extension map.

Top-level fields outside the schema are rejected. Extension data must stay under
`extensions` and must use `x-` prefixed keys so future core fields remain
unambiguous.

## Request Binding

`requestId` is the explicit binding to the RunRequest that this result
completes. Consumers must not infer repository, tenant, account, authorization,
or environment linkage from id shape, branch names, issue numbers, or
operator-facing summaries. Those bindings must come from authoritative scope
records outside this artifact.

When `requestId`, `correlationId`, provenance, or scope context is missing or
malformed, consumers should fail closed instead of accepting a guessed match.

## Fixture Safety

Checked-in RunResult fixtures must be synthetic and public. Raw credentials,
access tokens, private customer values, and host-local absolute paths are not
valid fixture content, even inside `extensions`, `errors`, `warnings`, or
verification summaries.
