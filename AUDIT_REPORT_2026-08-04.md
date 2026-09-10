# Production-Readiness Audit — 2026-08-04

## Scope and verification

Reviewed the FastAPI backend, authentication and authorization paths, persistence
models, upload/scanning flow, reporting, email, Docker configuration, frontend
source, tests, and existing documentation. The frontend production build succeeds
with `npm.cmd run build`. Backend modules compile with `python -m compileall` and
the hardened report-path helpers were imported successfully.

The full automated suites did not run: the committed virtual environment lacks
`pytest` and `httpx`, despite both being listed in `requirements.txt`; Vitest's
config bundler is blocked from reading its configuration by the local desktop
sandbox. These are environmental/reproducibility blockers, not passing results.

## Remediated defects

| Area | Root cause | Fix | Verification |
| --- | --- | --- | --- |
| JWT authentication | A source-controlled fallback secret allowed token forgery. | Development now uses an ephemeral random key; production refuses to start without `SECRET_KEY`. | Import/compile smoke check. |
| Admin provisioning | Startup created a public `admin` account with a known password. | Bootstrap is now opt-in through `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD`; secrets are never printed. | Code inspection and compile. |
| Login | Different errors disclosed whether a username existed. | Both failure paths return the same generic credential error. | Regression test added. |
| Reports | Filename parameters were directly joined to report storage paths. | JSON-only, basename-only validation protects view, download, PDF, and delete routes. | Helper import smoke check and regression tests added. |
| Email | SMTP diagnostic endpoint was public and report attachment filename was unconstrained. | Diagnostic endpoint is admin-only; recipient validation uses `EmailStr`; report filename is constrained. | Regression test added and compile. |
| Retention cleanup | `days=0` or a negative value could delete all reports. | Retention window is constrained to 1–3650 days. | Regression test added. |
| Configuration | Email example used different variable names from the service. | Documentation now uses `EMAIL_SMTP_SERVER` and `EMAIL_SMTP_PORT`; legacy names remain supported. | Code inspection. |

## Frontend review

The app already has lazy route loading, theme tokens, shared loading/confirmation/
toast primitives, responsive styles, and a successful production bundle. This
audit additionally added dialog semantics and notification live regions, and
removed one redundant risk-badge assignment.

The frontend is not lint-clean: `npm.cmd run lint` reports 39 errors and 4
warnings. The principal themes are untyped API data, derived state updated in
effects, callbacks declared after their effects, and Fast Refresh context export
rules. These need a dedicated frontend refactor before claiming a warning-free
release. `vendor-charts` is also 414.76 kB (117.38 kB gzip), which is a measurable
bundle-size optimization opportunity.

## Remaining production work

- Rebuild the virtual environment from `requirements.txt` and run the full pytest suite.
- Resolve all frontend lint findings and restore a runnable Vitest environment.
- Replace the in-memory rate limiter with a shared store such as Redis for multi-instance deployment.
- Review report-generation input escaping before allowing untrusted scan findings in rendered PDF text.
- Remove generated runtime artifacts (`dist`, reports, uploads, caches) from the working tree if they are tracked externally.
- Add CI that installs dependencies, executes backend/frontend tests, lint, type checks, and a container smoke test.

## Scores

- Production readiness: **61/100** — security defaults are materially safer and builds compile, but the test environment and frontend lint gate are failing.
- Portfolio readiness: **72/100** — broad feature coverage, documentation, design tokens, reports, AI, and Bandit integration demonstrate strong scope; cleanup and CI evidence are needed.
- Interview readiness: **75/100** — the project is a good basis for discussion when accompanied by this candid audit and a plan for the remaining quality gates.
