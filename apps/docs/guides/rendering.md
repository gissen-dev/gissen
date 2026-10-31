# Rendering and SSR

<GissenStatus />

`GissenRender` draws a page from a config and a document. It produces your components' own DOM and nothing else.

<<< @/snippets/guides/rendering/RenderOnly.vue [RenderOnly.vue]

## gissen/render or gissen

`GissenRender` is exported from both. In an app that only renders, import from `gissen/render`. That subpath contains the renderer and no editor code, on any bundler. Importing from `gissen` also works, and modern bundlers drop the editor. Older Rollup-based setups can keep the validation library in the bundle.

`gissen/render` also exports `defineGissenConfig` and every type, so one config file can serve both the editor app and a render-only app.

<<< @/snippets/guides/rendering/config.ts [gissen.config.ts]

## No wrapper elements

The editor wraps each node in a `div` for selection and dragging. `GissenRender` does not. The HTML is what your components produce.

`GissenRender` has no root element of its own, so a `class` or `style` on it goes nowhere. Put page-level styles on the root component or on an element around it.

## Props

| Prop | Description |
|---|---|
| `config` | The same config you give the editor. |
| `data` | The document the editor produced. The renderer never changes it. |

Both are reactive.

## Bad documents

`GissenRender` does its best with what it gets, so one bad node does not take down the page.

- A node whose type is not in the config is skipped. Its siblings still render. Development builds log a warning with the type and id.
- A missing prop is passed as `undefined`. The renderer never fills in values.
- It does not validate. If you want a hard failure, validate first.

<<< @/snippets/guides/rendering/strict.ts [strict.ts]

This document has a component the config does not know. `GissenRender` skips it. `validateData` rejects it.

<<< @/snippets/guides/rendering/unknown-type.json [unknown-type.json]

## Root component

When `config.root.render` is set, the page renders inside it. It receives `data.root.props` as props and the content in its default slot. The editor canvas uses the same wrapper, so what you edit matches what you ship.

<<< @/snippets/guides/rendering/components/PageShell.vue [PageShell.vue]

## Live preview

Bind the editor and the renderer to the same `ref`. Every edit, undo and redo shows in the rendered copy.

<<< @/snippets/guides/rendering/LivePreview.vue [LivePreview.vue]

## Server-side rendering

`GissenRender` uses no browser APIs and its output depends only on `config` and `data`. Render it on the server and hydrate on the client. `GissenEditor` also renders on the server. See [Nuxt](../getting-started/nuxt) for a working setup.
