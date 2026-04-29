# Fixtures

This directory is reserved for EIP contract fixtures.

Fixtures should be minimal examples that prove protocol behavior. Use
placeholders for credentials, tenants, hosts, and operator-specific values.

- `common/v1/valid/` contains valid EIP-0000 common type fixtures.
- `common/v1/invalid/` contains negative fixtures that must fail validation.
- `run-request/v1/valid/` contains valid EIP-0001 RunRequest fixtures.
- `run-request/v1/invalid/` contains negative RunRequest fixtures and fixture
  safety examples.
- `run-result/v1/valid/` contains valid EIP-0002 RunResult fixtures.
- `run-result/v1/invalid/` contains negative RunResult fixtures.
- `audit-event/v1/valid/` contains valid EIP-0003 AuditEvent fixtures.
- `audit-event/v1/invalid/` contains negative AuditEvent fixtures.
- `evidence-bundle-ref/v1/valid/` contains valid EIP-0004 EvidenceBundleRef
  fixtures.
- `evidence-bundle-ref/v1/invalid/` contains negative EvidenceBundleRef
  fixtures.
