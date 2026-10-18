# layouts-and-slots

A Gissen config with nested containers and allow lists, plus the `select` and `number` field types.

- `Columns` → `Column` → `Card` / `Text`: three levels, two of them containers.
- `Columns`'s `columns` slot only accepts `Column`. `Column`'s `children` slot only accepts `Card` or `Text`. Each slot sets its own `allow` list, independent of the other.
- `Card` has a `select` field (`size`) and a `number` field (`rating`, with `min`/`max`/`step`).

See `src/gissen.config.ts` for the config and `src/sample-page.ts` for a starting document that is already nested.

## A CSS detail worth knowing

In the editor, the named slot's direct child is Gissen's own `.gissen-slot` wrapper, with each component inside a `.gissen-node`, not the component itself. `Columns.vue` and `Column.vue` style those wrapper classes (via `:deep()`) to match their own layout, so the canvas looks the same as `GissenRender`'s output. Without that, the editor would stack what the renderer lays out in a row. See the comments in those two files.

## Run it

```sh
npm install
npm run dev
```

## Open in StackBlitz

[Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/layouts-and-slots)
