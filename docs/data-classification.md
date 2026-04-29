# Data Classification

EIP artifacts carry a DataClassification value so producers and consumers can
apply appropriate handling rules.

## Classification Values

- `public`: safe for checked-in fixtures, examples, documentation, and public
  conformance tests.
- `internal`: intended for routine internal protocol operations, but not for
  public fixtures.
- `confidential`: contains business-sensitive or user-sensitive production
  message data.
- `restricted`: contains highly sensitive production message data that requires
  the strictest supported handling.

## Fixture Data

public fixture data is synthetic, non-secret, and safe to publish in this
repository. Fixtures must not contain production identifiers, private customer
content, real credentials, access tokens, or host-local absolute paths.

Fixtures may resemble production message data structurally, but their values
must remain synthetic and must use `public` classification unless a test is
explicitly validating rejection of another value.

## Production Message Data

production message data may contain customer, tenant, account, repository,
workflow, or operational context. It must not be copied into this repository as
fixtures or examples.

Schemas define how production message data is shaped. They do not grant
permission to publish production message values.
