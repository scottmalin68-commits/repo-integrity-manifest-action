# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-22
### Added
- Initial release of **repo-integrity-manifest-action**.
- Full repository scanning engine with deterministic file ordering.
- SHA‑256 hashing for all tracked files.
- MIME type detection, file size capture, and permission metadata.
- Executable flag detection and Git LFS tracking awareness.
- Shannon entropy scoring for anomaly detection.
- Contributor count and first‑seen timestamp extraction.
- Last commit metadata for each file (author, email, timestamp, SHA).
- `.governance/repo-manifest.json` auto‑generation.
- Composite GitHub Action (`action.yml`) with:
  - Repository checkout
  - Node.js setup
  - Manifest generation
  - Auto‑commit of updated manifest
- Schema definition (`schema.json`) for manifest validation.
- Node.js manifest generator (`generate-manifest.mjs`).
- Governance‑grade README with:
  - Banner
  - Badge suite
  - Marketplace‑ready description
  - Best practices
  - Git pull / bot commit guidance
  - Usage examples and output schema
- Initial CI workflow (`test.yml`) for validating the Action.

### Notes
- This release introduces **Option A** behavior: the Action automatically commits the updated manifest back to the repository on every run.
- Users may need to run `git pull --rebase` before pushing changes due to bot‑generated commits.

---

## [Unreleased]
### Planned
- Optional artifact‑only mode (no auto‑commit).
- Optional diff reporting with severity scoring.
- Optional PR comment mode for manifest changes.
- Marketplace publication metadata and release tagging automation.
