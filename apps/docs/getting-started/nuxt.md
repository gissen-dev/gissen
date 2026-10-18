# Nuxt

<GissenStatus />

Gissen works in a Nuxt 4 app without a module. You import the components yourself. The code on this page comes from an example app that is built and type-checked in CI.

## Install

```sh
npm install gissen
```

## Schema and config

Put the field schema in its own module: `fields`, `defaultProps` and slot `allow` lists for every component type, with no `render`.

<<< @/../../examples/nuxt-ssr/schema.ts [schema.ts]

The client config attaches your real Vue components to that schema.

<<< @/../../examples/nuxt-ssr/gissen.config.ts [gissen.config.ts]

Your components live next to it, in `components/`.

### Why the split

`gissen.config.ts` imports `.vue` files for `render`. A Nitro server route that imports it, directly or indirectly, fails to build: Nitro bundles `server/` through its own Rollup pipeline, which has no Vue plugin, so every `.vue` import in that graph fails to parse. The config format conflates field schema (needed anywhere, including on the server) with render components (needed only in a Vue-aware bundler), and this example works around that by keeping the schema in its own render-free module and giving it a no-op `render` of its own, used only by server code that needs to call `validateData`.

This is a workaround, not a pattern to copy into every app. It's needed here because a server route validates a write. If you only read and render, you likely never import your config on the server at all outside a Vue/Nitro page (`GissenRender` itself runs fine on the server, since Nuxt's own Vite SSR build, unlike Nitro's API-route bundling, does have a Vue plugin).

## Load the editor styles

Import `gissen/style.css` once, in `app.vue`.

<<< @/../../examples/nuxt-ssr/app.vue [app.vue]

## Storage

A server route reads and writes the saved page. This one keeps it in memory (resets on every restart); point `nitro.storage` at a real driver for anything that needs to survive one.

<<< @/../../examples/nuxt-ssr/server/api/page.get.ts [server/api/page.get.ts]

<<< @/../../examples/nuxt-ssr/server/api/page.put.ts [server/api/page.put.ts]

The write validates against `schema.ts` before it touches storage, so a malformed document never reaches disk. In a real app, put authentication in front of this route: anyone who can reach it can overwrite the page.

## An editor page

<<< @/../../examples/nuxt-ssr/pages/index.vue [pages/index.vue]

`GissenEditor` renders on the server too, so you do not need `<ClientOnly>`. Wrapping it in `<ClientOnly>` is fine if you want editing to stay in the browser.

## A server-rendered page

<<< @/../../examples/nuxt-ssr/pages/render.vue [pages/render.vue]

- `GissenRender` is imported from `gissen/render`, so the page does not pull in the editor.
- The page runs on the server. The HTML it sends already contains your components, and the client hydrates it without mismatches.
- It fetches the same saved page the editor writes, so an edit shows up here on the next load.

## Check it

```sh
npm run build
node .output/server/index.mjs &
curl -X PUT localhost:3000/api/page -H 'content-type: application/json' -d '{"version":1,"root":{"props":{}},"content":[]}'
curl localhost:3000/render
```

The response body contains your components' HTML, built from whatever you just saved.

## Notes

- Pages that import `GissenEditor` need the editor stylesheet, so keep the import in `app.vue`.
- Gissen does not store pages. This example's `server/api/page.*` is one way to do it; a database, a file, or a third-party API work the same way.
