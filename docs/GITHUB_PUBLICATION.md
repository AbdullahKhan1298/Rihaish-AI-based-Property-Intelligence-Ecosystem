# GitHub publication and source/data boundaries

Repository created under the owner's existing authenticated account:

https://github.com/AbdullahKhan1298/Rihaish-AI-based-Property-Intelligence-Ecosystem

Visibility: **public**, as explicitly requested by the owner. Primary branch: `main`. GitHub CLI was not installed; existing Git Credential Manager credentials were used in memory for the official API. No credential/token was added to a remote URL, saved in source or published.

## Recoverability

- Private pre-edit source snapshot and consistent backups of all seven original SQLite files remain under ignored `.runtime/backups/fyp-baseline-20261101T114444Z-f3f5da/`.
- `3bcb382865a20745becfbf850633515df9835e9b`: `chore: establish RIHAISH working source baseline`.
- `61743d1ba092b4a468ec3de3f38a08261a8235e1`: `chore: remove artificial user-population demo`.
- Later FYP documentation/security/verification changes are separate commits. No existing history was overwritten and no force push is allowed.

## Excluded from every publication commit

`.env`/credentials/private keys; all database files and rqlite stores; backups; raw scraped CSV/ZIP datasets; unreviewed model binaries/PDFs; dependency/build/cache/log directories; raw local `docs/evidence/` payloads. The generated synthetic fixture database is preserved locally and excluded. Safe environment/schema/configuration templates and essential source/tools/docs are included.

The initial staged source was approximately 1 MB, compared with roughly 249 MB of non-runtime local candidates dominated by raw datasets. No Git LFS is needed for the small source tree; private datasets are not made public through LFS.

## Publication checks

Run `python scripts/check_publication.py --history` after staging. It checks every staged path and every reachable commit tree, including alternate paths for identical blobs; matches known ignored local secret values without printing them; detects common key/token/JWT signatures; rejects private paths and blobs over 5 MiB. Four unit tests cover path exclusions, templates, duplicate-content path protection and a synthetic token signature.

This is a targeted scan, not a complete security audit or a guarantee about unknown credentials. The live local environment/secret hash is preserved, raw records remain excluded, and no new license/IP declaration was assigned. Legacy frontend business-contact copy and unvalidated promotional labels remain visible in source as requested; they are explicitly not verified traction, legal evidence or model performance. They require a future approved content/provenance review.

The source-only repo requires authorized private data for an end-to-end local demo. Backend dependency ranges, CORS/deployment hardening, test-client deprecation and a frontend chunk warning remain follow-up items. Do not treat public source publication as deployment or production acceptance.

## Publication receipt

Final push and remote HEAD/tree checks are recorded here only after they actually succeed. At document preparation, repository creation is confirmed and source push is pending.
