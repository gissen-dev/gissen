# Contributing to Gissen

Thanks for your interest in contributing! Gissen is a headless visual editor for
Vue 3, MIT-licensed and developed in the open. This guide gets you from a fresh
clone to an open PR.

Gissen is in **pre-alpha** — APIs are unstable and the surface area changes
quickly. That makes well-scoped contributions (tests, docs, examples, a11y)
especially valuable. See the issues labelled
[`Good first issue`](https://github.com/gissen-dev/gissen/labels/Good%20first%20issue)
and [`Help wanted`](https://github.com/gissen-dev/gissen/labels/Help%20wanted)
for a curated starting point.

## Prerequisites

- **Node 20+** (the repo pins a version in [`.nvmrc`](./.nvmrc); `nvm use` picks it up)
- **pnpm 9** — this is a pnpm workspace. Enable it with `corepack enable` if you
  don't have it.

## Setup

```bash
git clone https://github.com/gissen-dev/gissen
cd gissen
pnpm install        # installs every workspace package
```

The monorepo layout:

```
packages/core/              # gissen — the editor library (Vue components, utils, validation)
packages/mcp/               # gissen-mcp — MCP server for AI agents
packages/create-gissen-app/ # create-gissen-app — project scaffolder
apps/docs/                  # VitePress documentation site
examples/basic-nuxt/        # a runnable Nuxt 4 app using Gissen
```

## Common commands

Run from the repo root (these fan out across all packages):

```bash
pnpm dev          # run dev servers across packages
pnpm build        # build all packages
pnpm test         # run all test suites
pnpm lint         # lint the whole repo (eslint, @antfu config)
pnpm lint:fix     # auto-fix lint issues
pnpm typecheck    # type-check across packages
```

To work on a single package, run its script directly — this is faster:

```bash
cd packages/core
pnpm test         # vitest run
pnpm test -- --watch
pnpm typecheck
```

To run the example app or the docs site locally:

```bash
pnpm --filter basic-nuxt dev    # the Nuxt example
pnpm --filter docs dev          # the VitePress docs
```

Before opening a PR, please make sure the full gate passes locally:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

CI runs exactly these steps (see [.github/workflows/ci.yml](./.github/workflows/ci.yml)).

## Branches & commits

- Branch off `main`. Use a short, descriptive name, e.g.
  `tests/tree-utils`, `docs/quickstart`, `fix/sidebar-a11y`.
- Commit messages follow **[Conventional Commits](https://www.conventionalcommits.org/)**
  with a package scope, matching the existing history:
  - `test(core): cover tree traversal utilities`
  - `docs: add a quickstart example`
  - `fix(core): scope keyboard shortcuts to the editor`
- Keep PRs focused. One logical change per PR is much easier to review.

## Opening a PR

1. Fork the repo (or push a branch if you have access).
2. Make sure the local gate above is green.
3. Open the PR against `main` and fill in the template.
4. Link the issue you're addressing (`Closes #123`).

### Review gate

Changes to **`packages/core`** — the editor component, the config API, the
public types, validation, and the shared utilities — receive careful review and
may take a few rounds. This is the load-bearing part of the project and we keep a
high bar for its API stability and correctness. Tests, docs, examples, and
self-contained fixes generally move faster. If you're planning a larger change to
core, please open an issue or a discussion first so we can align on the approach
before you write code.

## Where to ask questions

- **Bugs / feature proposals:** open an
  [issue](https://github.com/gissen-dev/gissen/issues/new/choose).
- **Open-ended questions / ideas:** start a
  [GitHub Discussion](https://github.com/gissen-dev/gissen/discussions).

Please also read our [Code of Conduct](./CODE_OF_CONDUCT.md).
