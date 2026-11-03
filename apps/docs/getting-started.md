# Getting Started

This quickstart adds Gissen to a Vue 3 app, registers two editable components,
and mounts the visual editor with starter page data.

## Install

Install the core package in your Vue app:

```bash
npm install gissen
```

In this repository, use the workspace example instead:

```bash
pnpm install
pnpm --filter basic-nuxt dev
```

The example app in [`examples/basic-nuxt`](https://github.com/gissen-dev/gissen/tree/main/examples/basic-nuxt)
contains the same pieces shown below.

## Create a couple of Vue components

Gissen renders your own components. Start with a simple hero:

```vue
<!-- components/HeroBlock.vue -->
<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <section class="hero-block">
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
  </section>
</template>
```

Add a second component so the editor sidebar has more than one block:

```vue
<!-- components/TextBlock.vue -->
<script setup lang="ts">
defineProps<{
  heading: string
  body: string
}>()
</script>

<template>
  <article>
    <h2>{{ heading }}</h2>
    <p>{{ body }}</p>
  </article>
</template>
```

## Define your Gissen config

Create `gissen.config.ts` next to your app entry. `defineGissenConfig` keeps the
component map typed, infers prop values from each field definition, and connects
each component name to the Vue component that should render it.

```ts
import { defineGissenConfig } from 'gissen'
import HeroBlock from './components/HeroBlock.vue'
import TextBlock from './components/TextBlock.vue'

export default defineGissenConfig({
  components: {
    HeroBlock: {
      fields: {
        title: { type: 'text' as const, label: 'Title' },
        subtitle: { type: 'textarea' as const, label: 'Subtitle' },
      },
      defaultProps: {
        title: 'Build pages visually',
        subtitle: 'Drag your own Vue components onto the canvas.',
      },
      render: HeroBlock,
    },
    TextBlock: {
      fields: {
        heading: { type: 'text' as const, label: 'Heading' },
        body: { type: 'textarea' as const, label: 'Body' },
      },
      defaultProps: {
        heading: 'How it works',
        body: 'Register components once, then edit page JSON visually.',
      },
      render: TextBlock,
    },
  },
})
```

See the [Config API](./config-api) for every field type, slot fields, runtime
validation helpers, and utility functions such as `createComponent`.

## Mount the editor

Import `GissenEditor`, bind a `GissenData` ref with `v-model:data`, pass the
config, and import the stylesheet once in your app.

```vue
<!-- App.vue, app.vue, or any Vue page -->
<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from './gissen.config'

import 'gissen/style.css'

const data = ref<GissenData>({
  root: { props: {} },
  content: [
    {
      type: 'HeroBlock',
      props: {
        id: 'hero-1',
        title: 'Build pages visually',
        subtitle: 'Drag your own Vue components onto the canvas.',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-1',
        heading: 'Plain JSON output',
        body: 'The editor mutates this data ref, so you can save it wherever your app stores content.',
      },
    },
  ],
})
</script>

<template>
  <GissenEditor
    v-model:data="data"
    :config="config"
    style="height: 100vh;"
  />
</template>
```

The editor fills its container, so give it an explicit height or flex parent.
See the [Editor reference](./editor) for sizing patterns, props, keyboard
shortcuts, and theming variables.

## Next steps

- Add `slot` fields when a component should accept nested Gissen components.
- Persist the `data` value as JSON in your CMS, database, or local storage.
- Use [`examples/basic-nuxt`](https://github.com/gissen-dev/gissen/tree/main/examples/basic-nuxt)
  as an end-to-end reference while the production renderer is still evolving.

To preview these docs locally from a repo checkout:

```bash
pnpm --filter docs dev
```
