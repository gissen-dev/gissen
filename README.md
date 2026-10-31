# Gissen

> A headless visual editor for Vue.

Gissen is in alpha. APIs can change between releases. Do not use it in production.

You register your own Vue components. Gissen adds the editor, the JSON document and the renderer. An AI agent can edit the same page through an MCP server, held to your config.

If you know [Puck](https://github.com/puckeditor/puck) for React, Gissen takes a similar approach for Vue.

## Install

```sh
npm install gissen
```

It needs Vue 3.4 or newer.

## Documentation

Everything is on **[gissen.dev](https://gissen.dev)**:

- [Quickstart](https://gissen.dev/getting-started/quickstart): an empty directory to a working editor.
- [Playground](https://gissen.dev/playground): the editor in your browser, nothing to install.
- [Guides](https://gissen.dev/guides/defining-components) and the [API reference](https://gissen.dev/api/gissen).
- [AI agents (MCP)](https://gissen.dev/agents/mcp): `gissen-mcp`, setup for Claude Desktop and Cursor, and every error message an agent can get.
- [Examples](https://gissen.dev/examples): four runnable apps, in [`examples/`](./examples).

Further reading: [Building a headless visual editor for Vue: the Vue answer to Puck](https://dev.to/yukos1221/building-a-headless-visual-editor-for-vue-the-vue-answer-to-puck-10b7), a technical deep dive on dev.to.

## Repository

```
packages/core/               gissen: the editor and the renderer
packages/mcp/                gissen-mcp: the MCP server for AI agents
packages/create-gissen-app/  create-gissen-app: project scaffolder (not released)
apps/docs/                   the documentation site (VitePress)
examples/                    vite-basic, nuxt-ssr, layouts-and-slots, mcp-agent
```

The examples are not workspace members. Each one is a standalone project that installs the published packages from npm.

## Development

This is a [pnpm](https://pnpm.io) workspace. It needs Node 20 or newer.

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more.

## License

[MIT](./LICENSE)
