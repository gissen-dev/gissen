# Working with page data

<GissenStatus />

The editor edits a `GissenData` document. That document is plain JSON. Gissen does not save it, load it or send it anywhere. That is your code.

<<< @/snippets/guides/page-data/page.json [page.json]

- `root.props` holds the root's props.
- `content` is the list of top-level components.
- Each component has a `type`, which is a key of your config, and `props`, which has its `id` and its field values.
- `version` is `1`. Nothing reads it yet. A document without it is valid.

## Start a document

`createEmptyData(config)` makes an empty page with the root's default props. `createComponent` makes a node from a component's defaults.

<<< @/snippets/guides/page-data/create.ts [create.ts]

## Bind it with v-model:data

<<< @/snippets/guides/page-data/Editor.vue [Editor.vue]

- Use `ref()`. The canvas relies on deep reactivity, so `shallowRef`, `markRaw` and plain objects are not supported.
- `update:data` fires after every change, including undo and redo. Save from there.
- Typing in a field produces many events. Debounce the save in your own code if your storage needs it.
- The editor validates `data` when it mounts. Invalid data throws a `GissenValidationError`. That is why the example waits for the saved page before it shows the editor.

## Storage is your job

Gissen has no storage. The editor only gives you JSON through `update:data`. The example calls two functions, and you write them.

<<< @/snippets/guides/page-data/storage.ts [storage.ts]

## Validate data you load

Treat saved JSON as untrusted. Components can be renamed or removed from the config after a page was saved, and someone can edit the file.

<<< @/snippets/guides/page-data/validate.ts [validate.ts]

`validateData` is strict about structure and lenient about missing values.

- It rejects unknown component types, unknown props, wrong value types, numbers outside `min` and `max`, options that do not exist, missing ids, and slot children outside an `allow` list.
- It accepts missing props, because a cleared field disappears from the JSON.
- It does not check for duplicate ids.

## Replace a document while the editor is open

The editor does not re-validate when you swap the whole document. Validate it yourself first.

<<< @/snippets/guides/page-data/replace.ts [replace.ts]

On a swap, the editor adds empty arrays for missing slots and resets undo history. You cannot undo across a swap.

## Render it

`GissenRender` takes the same document. See [Rendering and SSR](./rendering).
