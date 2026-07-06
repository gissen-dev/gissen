# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets),
but releases are **self-managed by the maintainer** — contributors do not need
to add changesets to their PRs.

## Releasing (maintainer)

Releases run as a one-click GitHub Action:

**Actions → Release → Run workflow** → pick the bump type (`patch` / `minor` /
`major`), type the changelog line, run.

The workflow creates the changeset from those inputs, versions the package,
generates `CHANGELOG.md`, commits the bump back to `main`, and publishes to npm
with provenance.

## Config notes

- Only `gissen` (packages/core) is published. `create-gissen-app`, `gissen-mcp`,
  and the private `gissen-docs` / `basic-nuxt` are in `ignore` in `config.json`.
- The project is in prerelease (`pre.json`, tag `alpha`), so versions read
  `0.1.0-alpha.N`. Because no stable release exists yet, changesets still
  publishes them under the `latest` dist-tag, so `npm install gissen` gets the
  newest alpha. Run `pnpm changeset pre exit` to graduate to stable.
