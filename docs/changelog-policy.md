# Changelog Policy

LineProof uses [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and [Semantic Versioning](https://semver.org/).

## Format

Every release entry contains one or more of these sections:

- **Added** — new features
- **Changed** — changes to existing behaviour
- **Deprecated** — features scheduled for removal
- **Removed** — removed features
- **Fixed** — bug fixes
- **Security** — security-related fixes

## Versioning Rules

| Change | Version bump |
|--------|-------------|
| Breaking contract interface change | MAJOR |
| New contract function or SDK feature | MINOR |
| Bug fix, docs, refactor, test | PATCH |
| Pre-release / alpha | `1.0.0-alpha.1` |

## Contributing a Changelog Entry

When opening a pull request that changes user-facing behaviour:

1. Add an entry under `## [Unreleased]` in `CHANGELOG.md`.
2. Use present tense: "Add `expire()` to escrow contract" not "Added".
3. Reference the relevant contract, package, or module in brackets: `[escrow]`, `[sdk]`, `[backend]`.
4. Link the PR number at the end: `(#42)`.

## Release Process

1. Create a release PR that moves all `[Unreleased]` entries to a new version section.
2. Update version fields in `contracts/Cargo.toml`, `sdk/package.json`, `backend/package.json`.
3. Tag the commit: `git tag v0.2.0`.
4. Push the tag — the release workflow publishes the SDK and uploads WASM artifacts automatically.
