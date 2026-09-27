# Gissen

> The headless visual editor for Vue. Agent-native, self-hostable, MIT-licensed.

![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange)

Gissen is an open-source headless visual editor for Vue 3. Developers register
their existing Vue components with a typed config object; end-users (or AI
agents, via [an MCP server](./packages/mcp)) drag and drop those components onto
a canvas to build pages. The output is JSON describing the page tree, which the
developer renders back into real Vue components in their app.

It is the Vue equivalent of [Puck](https://github.com/puckeditor/puck), the
React-based visual editor.

> **Status:** pre-alpha. APIs are unstable. The editor canvas with
> drag-and-drop, the properties panel, undo/redo history, viewport preview,
> the production renderer (`<GissenRender>`, SSR-ready), and the MCP server for
> AI agents are functional.

## Demo & deep dive

[![Watch the demo](https://img.youtube.com/vi/tT_0eCHhnIE/maxresdefault.jpg)](https://youtu.be/tT_0eCHhnIE)

📺 **[Watch the demo video](https://youtu.be/tT_0eCHhnIE)**

📝 **[Building a headless visual editor for Vue: the Vue answer to Puck](https://dev.to/yukos1221/building-a-headless-visual-editor-for-vue-the-vue-answer-to-puck-10b7)** — a technical deep dive on dev.to.

## Quickstart

```bash
npm install gissen
```

**1. Register your components** — a typed config maps component names to
editable fields and the Vue component that renders them:

```ts
// gissen.config.ts
import { defineGissenConfig } from 'gissen/render'
import Hero from './components/Hero.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
      },
      defaultProps: { title: 'Hello world' },
      render: Hero,
    },
  },
})
```

**2. Edit** — drop `<GissenEditor>` on a page; users build the page tree
visually, and the document is plain JSON you can persist anywhere:

```vue
<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from './gissen.config'
import 'gissen/style.css'

const data = ref<GissenData>({ root: { props: {} }, content: [] })

function save() {
  localStorage.setItem('page', JSON.stringify(data.value))
}
</script>

<template>
  <button @click="save">
    Save
  </button>
  <GissenEditor v-model:data="data" :config="config" style="height: 100vh;" />
</template>
```

**3. Render** — put `<GissenRender>` on the real page with the saved JSON.
Imported from `gissen/render`, it ships without the editor stack, emits zero
wrapper elements, and is SSR-safe:

```vue
<script setup lang="ts">
import type { GissenData } from 'gissen/render'
import { GissenRender } from 'gissen/render'
import config from './gissen.config'

const data: GissenData = JSON.parse(localStorage.getItem('page') ?? '{"root":{"props":{}},"content":[]}')
</script>

<template>
  <GissenRender :config="config" :data="data" />
</template>
```

See the [documentation](https://gissen.dev) and the
[basic-nuxt example](./examples/basic-nuxt) for the full tour, including SSR.

## AI agents (MCP)

The same config drives [`gissen-mcp`](./packages/mcp), a Model Context Protocol
server that lets an AI agent read and edit a page tree on disk. Nothing to
install — your client spawns it through `npx`:

```json
{
  "mcpServers": {
    "gissen": {
      "command": "npx",
      "args": [
        "-y",
        "gissen-mcp",
        "--config",
        "/absolute/path/to/your/gissen.config.ts",
        "--data",
        "/absolute/path/to/your/page.json"
      ]
    }
  }
}
```

The agent is constrained by that config: the component types, fields, select
options, and slot `allow` lists you declared become the tool schemas it sees, so
it can only build with components you registered — and every rejected edit names
what was wrong and what's available instead.

Setup for Claude Desktop and Cursor, the five tools, and the config
constraints in detail: [`gissen-mcp` README](./packages/mcp/README.md).

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
