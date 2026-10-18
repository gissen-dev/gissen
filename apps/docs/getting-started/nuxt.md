# Nuxt

<GissenStatus />

Gissen works in a Nuxt 4 app without a module. You import the components yourself. The code on this page comes from an example app that is built and type-checked in CI.

## Install

```sh
npm install gissen
```

## Config

Put the config in the project root. The editor page and the render page both import it.

<<< @/../../examples/basic-nuxt/gissen.config.ts [gissen.config.ts]

Your components live next to it, in `components/`.

## Load the editor styles

Import `gissen/style.css` once, in `app.vue`.

<<< @/../../examples/basic-nuxt/app.vue [app.vue]

## An editor page

<<< @/../../examples/basic-nuxt/pages/index.vue [pages/index.vue]

`GissenEditor` renders on the server too, so you do not need `<ClientOnly>`. Wrapping it in `<ClientOnly>` is fine if you want editing to stay in the browser.

## A server-rendered page

<<< @/../../examples/basic-nuxt/pages/render.vue [pages/render.vue]

- `GissenRender` is imported from `gissen/render`, so the page does not pull in the editor.
- The page runs on the server. The HTML it sends already contains your components, and the client hydrates it without mismatches.
- In your own app, load the document from your storage instead of a sample. `useFetch` or `useAsyncData` work, as usual in Nuxt.

## Check it

Run `npm run build`, start the server with `node .output/server/index.mjs`, and request `/render`. The response body contains your components' HTML.

## Notes

- Pages that import `GissenEditor` need the editor stylesheet, so keep the import in `app.vue`.
- Gissen does not store pages. Saving and loading is code in your Nuxt app, for example a server route.
