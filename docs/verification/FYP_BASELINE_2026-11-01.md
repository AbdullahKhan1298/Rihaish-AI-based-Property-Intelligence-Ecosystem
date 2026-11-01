# FYP baseline verification — November 1, 2026

This public summary omits credentials, record payloads and machine-local private data. Raw reports and screenshots are retained locally under ignored `docs/evidence/`; consistent backups remain under ignored `.runtime/`.

| Check | Observed result |
|---|---|
| `python -m unittest discover -s tests -v` | **PASS: 21 tests**, 4.705 s; SQL shape/filter/sort/page/injection tests, auth/RBAC/OTP/watchlist fixtures, launch logging, admission and publication gate. |
| Source-only copy, no private .env or DB files | **PASS: 21 tests**, 3.671 s with installed dependencies and an ephemeral test-only secret. Removed the batching test's private-data dependency and fixed a Windows child-exit/log-lock race. The initial failed source-only attempt is retained; no clean dependency install is claimed. |
| `npm.cmd run build` in frontend | **PASS**, 2236 modules, 16.75 s. Large-chunk warning retained. |
| Existing Caddy configuration validation | **PASS**. A formatting warning and connection-refused probes while APIs were stopped did not invalidate configuration validation. |
| Native cluster/startup | **PASS**: all three retained voters reachable, real quorum read, one leader; api1/api2/Caddy ready on rqlite. No migration/import/reset. |
| `python scripts/verify_dds_smoke.py --frontend` | **PASS**: twelve actual sorted city reads; both API IDs; numeric bounds, text search, global sorted pages with ten distinct IDs; unauthenticated profile 401; all services/frontend proxy ready. |
| Actual auth verifier with separate FYP output | **PASS**: buyer/admin login, JWT across both APIs, role denial, sixteen watchlist toggles, exactly one OTP consumer, reset protections. Only UUID fixtures cleaned; users 0→0. |
| Seven original source files and frontend | **PASS**, original file hashes unchanged and no frontend source changes. |
| Reused migration prepare/verify functions | **PASS**, 31 original table counts/content hashes match a consistent current cluster backup. A new private candidate was built; no cluster import/write. |
| Browser navigation | **PASS**: Home, populated Search (217 under its existing default budget), ascending-price control and property detail rendered. Unauthenticated admin dashboard redirected to login. No account/inquiry form submitted. |
| Massive population retirement | **PASS**: generator/test removed from active tooling, historical guides marked retired, legitimate sampler extracted, no matching product/startup hooks found. No generated fixture DB/raw report deleted. |

The current retained source has 224 properties, 18 society parents, zero source users and 134 inherited missing society references. These are development-copy facts, not genuine customer-population or legal-verification claims.

Warnings: installed Starlette test-client/HTTPX deprecation; frontend chunk >500 kB. The generated Windows backend lock captures installed versions, not a clean-install portability test.

Not repeated: disruptive node failure, large-burst overload, k6 or external mail/payment/government-provider calls. Prior real failure/recovery and uniqueness evidence remains; historical failed sustained-load results are not upgraded to passing. Forecast accuracy, government authenticity, construction audit, traffic estimates and commercial readiness remain qualified in the FYP status document.

Publication gate passed with zero findings across staged content and reachable history. Public source commit `40f65dd25059ed1442c6d137c2665fd167b7f759` and all 122 source paths were independently confirmed through GitHub's unauthenticated API; see `GITHUB_PUBLICATION.md`. No Git LFS is needed for this small source-only tree; large/private runtime artifacts are not tracked.
