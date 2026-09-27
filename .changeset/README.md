# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets),
but releases are **self-managed by the maintainer** — contributors do not need
to add changesets to their PRs.

## Releasing (maintainer)

Releases run as a one-click GitHub Action:

**Actions → Release → Run workflow** → pick the package (`gissen` /
`gissen-mcp`), the bump type (`patch` / `minor` / `major`), type the changelog
line, run.

The workflow creates the changeset from those inputs, versions the packages,
generates `CHANGELOG.md`, commits the bump back to `main`, publishes to npm with
provenance, and points each package's `latest` dist-tag at what it just shipped.

A run is not limited to the package you pick: every pending changeset in this
folder applies too, and `gissen-mcp` pins `gissen` exactly (`workspace:*`), so a
`gissen` release always forces a `gissen-mcp` release along with it. The reverse
does not hold — releasing `gissen-mcp` leaves `gissen` alone.

## Config notes

- `gissen` (packages/core) and `gissen-mcp` (packages/mcp) are published.
  `create-gissen-app` and the private `gissen-docs` / `basic-nuxt` are in
  `ignore` in `config.json`. `ignore` only stops *versioning* — `changeset
  publish` doesn't read the list at all; what actually keeps
  `create-gissen-app` off npm is that its local `0.0.0` is already published
  there, so it's skipped as "already published". Bump it and it ships.
- The project is in prerelease (`pre.json`, tag `alpha`), so versions read
  `0.1.0-alpha.N`. In pre mode changesets publishes under the `alpha` dist-tag
  and leaves `latest` untouched. Its one exception — prerelease-only packages go
  to `latest` — applies to neither of ours, because both already have a
  non-prerelease version on npm (`gissen@0.0.1`, `gissen-mcp@0.0.0`). The
  release workflow therefore moves `latest` itself; without that step a bare
  `npm install gissen` or `npx gissen-mcp` would resolve to those ancient
  versions. Run `pnpm changeset pre exit` to graduate to stable.
- Applied changeset files stay in this folder until `pre exit` — they're
  recorded in `pre.json` and won't bump anything a second time.
