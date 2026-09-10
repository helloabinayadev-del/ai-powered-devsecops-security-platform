# Production Readiness Notes

## Verified remediation

- The local frontend API fallback now targets port `8000`, matching the backend container and documented FastAPI server.
- Upload content is streamed to disk in 1 MiB chunks and rejected immediately once it exceeds `MAX_FILE_SIZE`; oversized content is no longer fully persisted before validation.
- File deletion requires the same administrator role used by upload and report-management endpoints.
- The shared frontend design layer supplies token-based light, dark, and high-contrast themes, standardized controls, table behavior, responsive layouts, and keyboard focus indicators.

## Operating requirements

- Set a unique `SECRET_KEY`, database password, and SMTP credentials through environment variables before deploying.
- Keep `AI_ENABLED=false` unless an approved model provider and API key are configured.
- Run the backend and frontend test suites in an environment where Python and Vitest may access their configured runtime paths.

## Known limitations

- Local automated tests could not be executed in this managed workspace: the bundled virtual-environment Python executable is denied execution, and Vitest/esbuild is denied access to its configuration path before discovery.
- Authenticated end-to-end testing requires a non-production test account and configured dependent services (database, Bandit, and optionally SMTP/AI).
