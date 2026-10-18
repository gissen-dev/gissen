# Quickstart

<GissenStatus />

You will build a Vue app with the Gissen editor on top and the rendered page below it. You need Node 20.19 or newer, or Node 22.12 or newer, which is what the current Vite template requires.

## 1. Create a Vue project

```sh
npm create vite@latest my-gissen-app -- --template vue-ts --no-interactive
cd my-gissen-app
npm install
```

## 2. Install Gissen

```sh
npm install gissen
```

Gissen needs Vue 3.4 or newer. The Vite template already has it.

## 3. Write a component

This is the Vue component Gissen will render. It declares `id` because Gissen passes the id of every node to its component.

<<< @/snippets/quickstart/src/components/Hero.vue [src/components/Hero.vue]

## 4. Register it in a config

The config tells Gissen which components exist and which of their props are editable.

<<< @/snippets/quickstart/src/gissen.config.ts [src/gissen.config.ts]

## 5. Add the editor and the renderer

Both components read the same `ref`, so every edit shows up on the right at once.

<<< @/snippets/quickstart/src/App.vue [src/App.vue]

## 6. Load the editor styles

Replace the contents of `src/main.ts`. It imports `gissen/style.css`.

<<< @/snippets/quickstart/src/main.ts [src/main.ts]

The template's `src/style.css` and `src/components/HelloWorld.vue` are no longer used. You can delete them.

## 7. Run it

<!-- quickstart-check: skip -->
```sh
npm run dev
```

Open the URL Vite prints. Click the Hero block, change its title in the panel, and watch the rendered page below update.

## What you built

- `defineGissenConfig` describes your components. TypeScript infers prop types from the `fields`.
- `GissenEditor` edits a `GissenData` document. You own that document and decide where to save it.
- `GissenRender` turns the same document into your components, with no editor code around them.

## Next

- [Defining components](../guides/defining-components) covers every field type.
- [Working with page data](../guides/page-data) covers validation and saving.
- [Rendering and SSR](../guides/rendering) covers render-only apps.
- [Nuxt](./nuxt) covers server-side rendering in Nuxt.
