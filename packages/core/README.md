# Gissen

> The headless visual editor for Vue. Agent-native, self-hostable, MIT-licensed.

> **Pre-alpha — APIs are unstable. Do not use in production yet.**

Gissen lets you register your existing Vue 3 components with a typed config object so end-users (or AI agents, via an MCP server) can drag and drop them onto a canvas to build pages. The output is plain JSON that you render back into real Vue components.

It is the Vue equivalent of [Puck](https://github.com/puckeditor/puck).

## Install

```bash
npm install gissen
```

Requires Vue 3.4+.

## Quick start

**1. Define a config**

```ts
// gissen.config.ts
import { defineGissenConfig } from 'gissen'
import Hero from './components/Hero.vue'

export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        cta: {
          type: 'select',
          label: 'CTA',
          options: [
            { label: 'Sign up', value: 'signup' },
            { label: 'Buy now', value: 'buy' },
          ] as const,
        },
      },
      defaultProps: { title: 'Hello', subtitle: '', cta: 'signup' },
      render: Hero,
    },
  },
})
```

**2. Drop in the editor**

```vue
<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from './gissen.config'
import 'gissen/style.css'

const data = ref<GissenData>({ root: { props: {} }, content: [] })
</script>

<template>
  <GissenEditor v-model:data="data" :config="config" style="height: 100vh;" />
</template>
```

`data` is plain JSON — persist it however you like (database, file, API).

## Documentation

Full docs at **[gissen.dev](https://gissen.dev)** — Config API reference, slot components, keyboard shortcuts, theming.

## Status

| Feature | Status |
|---|---|
| Editor canvas with drag-and-drop | ✓ Available |
| Keyboard shortcuts (Escape / Delete) | ✓ Available |
| Properties panel | In progress |
| Production renderer (`<GissenRender>`) | In progress |
| MCP server for AI agents | In progress |

## License

[MIT](https://github.com/gissen-dev/gissen/blob/main/LICENSE)
