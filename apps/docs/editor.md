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
| `v-model:data` | `GissenData` | ✓ | The page tree. Two-way binding — mutations from inside the editor are reflected back to the parent. Must be deeply reactive; see below. |

### Reactivity requirement

Bind `data` with `ref()`. The canvas re-renders nested nodes through Vue's deep
reactive tracking, so a `shallowRef`, a `markRaw` slice, or a plain non-reactive
object is not supported: the properties panel would update while the canvas
keeps rendering stale values. Development builds print a console warning when a
non-reactive `data` is detected.

### Replacing `data` externally

`data` is validated once, at mount; from there the editor keeps the tree valid
through its own operations. Replacing the bound `data` with a new document at
runtime is on the caller's honor — the editor does not re-validate it. If you
swap documents in, run `validateData` (see [Config API](./config-api#runtime-validation))
on the new value first; malformed data fails at render time, not at the swap.

Two things do happen automatically on a swap: the incoming document gets the
same acceptance-time slot normalization as the initial one, and the undo
history is reset — the replaced document becomes the new baseline, so you
cannot undo across an external document swap.

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
| `Ctrl+Z` / `⌘Z` | Undo the last document change |
| `Ctrl+Shift+Z` / `⇧⌘Z`, `Ctrl+Y` / `⌘Y` | Redo the last undone change |

Shortcuts fire while focus is inside the editor canvas, so two editors on one
page never interfere. While you are typing in a field, `Ctrl+Z` stays the
browser's native text undo — document history is not touched.

Deleting doesn't require the keyboard: the selected node shows a small action
toolbar with a delete button. There is no confirmation dialog — undo is the
safety net.

## Undo & redo

Every document change — inserting, moving, or deleting a component, and every
property edit — is undoable, via the toolbar buttons above the canvas or the
shortcuts. History holds up to 100 steps and is in-memory only: it is not
persisted, and it starts fresh on every mount.

A few behaviors worth knowing:

- **Typing coalesces.** Consecutive edits to the same field collapse into one
  step, so undoing after typing a word restores the value before you started
  typing — not one character at a time. Switching to another field or
  component, making a structural change, or pausing for a moment starts a new
  step.
- **Redo clears on new edits.** After an undo, any new change discards the
  redo branch (history is linear).
- **Selection is reconciled.** If the node you had selected no longer exists
  after an undo/redo, the selection is cleared; otherwise it is kept.
- **External swaps reset history.** Replacing the bound `data` document resets
  the history to the new document (see above).

Each undo/redo emits `update:data` exactly like a normal edit, so hosts that
persist on that event also see history navigation.

## Viewport preview

The toolbar's viewport switcher previews the canvas at three widths: desktop
(full pane), tablet (768px), and mobile (375px). When the pane is narrower
than the chosen preset, the frame scales down to fit.

The preview is **editor-only state**: it is never written into `GissenData`,
does not survive in the emitted document, and undo/redo never change it.
Gissen deliberately has no per-breakpoint property overrides — responsive
behavior belongs to your components, not to the document. The preview simply
lets you watch them respond while editing.

One thing to know about how your components respond inside the preview: the
frame constrains width without resizing the browser window, so **CSS media
queries do not react to it**. The frame is declared as a size container
(`container-type: inline-size`), so **container queries and `cq*` units do**
— and intrinsic layout (flex wrap, grid `auto-fill`, `min()`/percentages)
responds naturally. Components written with `cqw` degrade gracefully outside
any container: the units then resolve against the real viewport.

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
