# Gissen

> The headless visual editor for Vue. Agent-native, self-hostable, MIT-licensed.

![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange)

Gissen is an open-source headless visual editor for Vue 3. Developers register
their existing Vue components with a typed config object; end-users (or AI
agents, via an MCP server) drag and drop those components onto a canvas to build
pages. The output is JSON describing the page tree, which the developer renders
back into real Vue components in their app.

It is the Vue equivalent of [Puck](https://github.com/puckeditor/puck), the
React-based visual editor.

> **Status:** pre-alpha. APIs are unstable. The editor canvas with
> drag-and-drop and the properties panel are functional; the production
> rendering API is in progress.

## Demo & deep dive

[![Watch the demo](https://img.youtube.com/vi/tT_0eCHhnIE/maxresdefault.jpg)](https://youtu.be/tT_0eCHhnIE)

📺 **[Watch the demo video](https://youtu.be/tT_0eCHhnIE)**

📝 **[Building a headless visual editor for Vue: the Vue answer to Puck](https://dev.to/yukos1221/building-a-headless-visual-editor-for-vue-the-vue-answer-to-puck-10b7)** — a technical deep dive on dev.to.

## Monorepo structure

```
gissen/
├── packages/
│   ├── core/                # gissen — editor + renderer library
│   ├── mcp/                 # gissen-mcp — MCP server for AI agents
│   └── create-gissen-app/   # create-gissen-app — project scaffolder
├── apps/
│   └── docs/                # VitePress documentation site
└── examples/
    └── basic-nuxt/          # Example Nuxt 4 app using Gissen
```

## Development

This is a [pnpm](https://pnpm.io) workspace. Requires Node 20+.

```bash
pnpm install     # install all workspace dependencies
pnpm dev         # run dev servers across packages
pnpm build       # build all packages
pnpm test        # run tests across packages
pnpm lint        # lint the whole repository
pnpm typecheck   # type-check across packages
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more.

## License

[MIT](./LICENSE)
