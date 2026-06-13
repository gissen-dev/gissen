# Editor

`<GissenEditor>` is the visual drag-and-drop editor component. Drop it into any Vue 3 page and it renders a three-panel layout: a component sidebar on the left, a canvas in the center, and a properties panel on the right.

## Basic usage

```vue
<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from './gissen.config'

// Import the editor stylesheet once, anywhere in your app
import 'gissen/style.css'

const data = ref<GissenData>({ root: { props: {} }, content: [] })
</script>

<template>
  <GissenEditor v-model:data="data" :config="config" style="height: 100vh;" />
</template>
```

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `config` | `GissenConfig` | ✓ | The component registry. See [Config API](./config-api). |
| `v-model:data` | `GissenData` | ✓ | The page tree. Two-way binding — mutations from inside the editor are reflected back to the parent. |

## Sizing

The editor fills its container element via `height: 100%`. Make sure the container has an explicit height:

```vue
<!-- Full viewport -->
<GissenEditor style="height: 100vh;" ... />

<!-- Fill a flex parent -->
<div style="display: flex; flex-direction: column; height: 100vh;">
  <nav>...</nav>
  <GissenEditor style="flex: 1; min-height: 0;" ... />
</div>
```

The canvas area scrolls independently. The sidebar and panel have their own scroll if their content overflows.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Escape` | Deselect the currently selected component |
| `Delete` / `Backspace` | Remove the selected component from the canvas |

## Wrapper elements in editor mode

In editor mode each component instance on the canvas is wrapped in a `<div class="gissen-node">`. This wrapper provides the selection outline, the drag target, and `data-gissen-id` for internal bookkeeping. It is **only present in editor mode** — the production renderer (`<GissenRender>`, coming soon) renders components with zero wrappers.

## Theming

Override the CSS custom properties to match your brand:

```css
:root {
  --gissen-accent: #4f46e5;       /* selection outline, drag highlight */
  --gissen-accent-light: #e0e7ff; /* hover backgrounds */
  --gissen-bg: #ffffff;           /* editor background */
  --gissen-surface: #f8f9fa;      /* sidebar / panel background */
  --gissen-border: #e2e8f0;       /* subtle borders */
  --gissen-text: #1e293b;         /* primary text */
  --gissen-text-muted: #64748b;   /* secondary text */
  --gissen-sidebar-width: 260px;
  --gissen-panel-width: 300px;
}
```

All `gissen-*` CSS classes are prefixed and will not collide with your application styles.
