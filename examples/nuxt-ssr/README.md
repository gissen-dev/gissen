# nuxt-ssr

A Nuxt 4 app with a Gissen editor and a server-rendered page, backed by a
real (if minimal) storage layer.

- `/`: `GissenEditor`. Loads the saved page over HTTP, saves on every
  change.
- `/render`: `GissenRender`, imported from `gissen/render`. Fetches the
  same saved page and renders it on the server. The client receives real
  HTML, not an empty shell.
- `server/api/page.get.ts` / `page.put.ts`: the storage. In-memory
  (`nitro.storage` in `nuxt.config.ts`), so it resets on every server
  restart. Swap the driver, or write your own storage, for anything that
  needs to survive a restart.

## A schema/render split, and why it's here

`gissen.config.ts` imports `.vue` components for `render`. Nitro bundles
`server/` routes through its own Rollup pipeline, which has no Vue plugin,
so importing `gissen.config.ts` from a server route fails to build. `PUT
/api/page` needs to call `validateData` before writing, so it imports
`schema.ts` instead: the same `fields`, `defaultProps` and slot `allow`
lists as `gissen.config.ts`, with every `render` replaced by a no-op
function that is never called.

This is a workaround for a real gap in the config shape (it conflates field
schema with render components), not a pattern to copy elsewhere. See
`schema.ts`'s own comment, and "Separate schema from render in the config
API" in the repo's `AUDIT_BACKLOG.md`.

## Run it

```sh
npm install
npm run dev
```

In a real app, put authentication in front of `PUT /api/page`. Anyone who
can reach it can overwrite the page. This example does not add it.

## Open in StackBlitz

[Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/nuxt-ssr)
