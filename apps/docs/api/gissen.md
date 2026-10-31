# gissen and gissen/render

<GissenStatus />

Everything the two entry points export, and the stylesheet. Each entry below says where you can import it from.

| Entry point | Contains |
|---|---|
| `gissen` | The editor, the renderer, helpers, validation, all types. |
| `gissen/render` | The renderer, `defineGissenConfig` and all types. No editor, no validation. |
| `gissen/style.css` | The editor stylesheet. |

Use `gissen/render` in apps that only render. See [Rendering and SSR](../guides/rendering#gissen-render-or-gissen).

## Components

### `GissenEditor`

Entry points: `gissen`

The visual editor. A sidebar of components on the left, a canvas in the middle, a properties panel on the right.

| Prop | Type | Required | Description |
|---|---|---|---|
| `config` | `GissenConfig` | yes | The component registry. Validated when the editor mounts and again if you replace it. |
| `data` | `GissenData` | yes | The page tree. Bind it with `v-model:data`. |

| Event | Payload | Description |
|---|---|---|
| `update:data` | `GissenData` | Emitted after every change: edits, drops, deletes, undo and redo. |

- The editor validates `config` and `data` once, when it mounts. It throws `GissenValidationError` if either is invalid.
- `data` must be a deeply reactive `ref()`. A `shallowRef` or a plain object is not supported.
- The editor fills its parent with `height: 100%`. Give the parent a height.
- Import `gissen/style.css` once in your app.

See [The editor](../guides/editor) for sizing, shortcuts, undo and viewport preview.

### `GissenRender`

Entry points: `gissen`, `gissen/render`

The production renderer. It draws your components from a config and a document, with no editor chrome and no wrapper elements. Safe to render on the server.

| Prop | Type | Required | Description |
|---|---|---|---|
| `config` | `GissenConfig` | yes | The same config you give the editor. |
| `data` | `GissenData` | yes | The document to render. The renderer never changes it. |

- Both props are reactive. Replacing either re-renders.
- It has no root element, so a `class` or `style` on it goes nowhere.
- Nodes with a type that is not in `config.components` are skipped. Development builds log a warning.
- It does not validate. Call `validateData` first if you need strictness.

## Functions

### `defineGissenConfig`

Entry points: `gissen`, `gissen/render`

`defineGissenConfig(config)` returns `config` unchanged. It exists so TypeScript can infer prop types from `fields`.

- `defaultProps` is checked against the types inferred from `fields`.
- Each `render` component is checked against the props it will receive: the non-slot fields plus `id`.
- `select` option values are narrowed to their literals.

See [Defining components](../guides/defining-components).

### `createComponent`

Entry points: `gissen`

`createComponent(type, config)` returns a new `ComponentData` for a registered type.

- `props` starts as a deep copy of the type's `defaultProps`.
- `props.id` is a new id from `generateId`.
- Every slot field is set to `[]` unless `defaultProps` provides an array. Children found in `defaultProps` slots get new ids.
- It throws a plain `Error` if `type` is not in `config.components`.

### `createEmptyData`

Entry points: `gissen`

`createEmptyData(config?)` returns `{ version: 1, root: { props }, content: [] }`.

- `root.props` is a deep copy of `config.root.defaultProps` when you pass a config. Otherwise it is `{}`.

### `ensureId`

Entry points: `gissen`

`ensureId(component)` makes sure `component` and every child in its slot fields has a non-empty `props.id`.

- Existing ids are kept.
- It returns the same object if nothing needed an id. Otherwise it returns a new tree.
- Use it on trees from outside the editor, such as JSON written by a script.

### `generateId`

Entry points: `gissen`

`generateId()` returns a random 10-character id.

### `validateConfig`

Entry points: `gissen`

`validateConfig(config)` takes `unknown` and returns a `GissenConfig`. It throws `GissenValidationError` if the config is malformed.

It checks that:

- each component has `fields` and a `render` component;
- no field is named `id`, which is reserved;
- every key in `defaultProps` is a declared field and not `id`;
- `defaultProps` values are not `null`, match the field type, and respect `min`, `max` and the `select` options;
- a `number` default is finite.

`defaultProps` for slot fields are not checked.

### `validateData`

Entry points: `gissen`

`validateData(data, config)` takes `unknown` and returns a `GissenData`. It throws `GissenValidationError` if the document does not match the config.

It rejects:

- unknown component types;
- props that are not declared in `fields`;
- values of the wrong type, numbers outside `min` and `max`, and `select` values that are not options;
- nodes without a non-empty string `id`, at any depth;
- slot children whose type is not in the slot's `allow` list;
- root props that are not declared in `config.root.fields`, when the config declares them.

It accepts missing props. A cleared field disappears from JSON, and the editor's own output must validate.

See [Working with page data](../guides/page-data).

## Classes

### `GissenValidationError`

Entry points: `gissen`

Thrown by `validateConfig` and `validateData`. Extends `Error`.

| Member | Type | Description |
|---|---|---|
| `name` | `string` | `'GissenValidationError'`. |
| `message` | `string` | Every problem on one line, each with its path: `[content[0].props.title] Prop "title" must be a string (got number)`. |
| `issues` | `ZodIssue[]` | The same problems as objects. Use `path` and `message`. The type comes from `zod`. |

## Types

### `GissenConfig`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `components` | `Record<string, ComponentConfig>` | The registry. Keys are the component type names stored in documents. |
| `root` | `RootConfig` | Optional. Configures the page root. |

### `ComponentConfig`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `fields` | `Record<string, FieldConfig>` | The editable props. `id` is reserved. |
| `defaultProps` | `Partial<InferComponentProps<fields>>` | Values for new instances. Optional. |
| `render` | `Component` | The Vue component. Receives the non-slot fields plus `id` as props, and slot fields as named slots. |

### `RootConfig`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `fields` | `Record<string, FieldConfig>` | Optional. When set, `validateData` checks `data.root.props` against it. |
| `defaultProps` | `Partial<TProps>` | Optional. Applied by `createEmptyData`. |
| `render` | `Component` | Optional. Wraps the page. Receives `data.root.props` as props and the content in its default slot. |

The properties panel has no UI for root props yet.

### `FieldConfig`

Entry points: `gissen`, `gissen/render`

The union of the six field types: `TextField | TextareaField | NumberField | SelectField | BooleanField | SlotField`. Discriminated by `type`.

### `FieldType`

Entry points: `gissen`, `gissen/render`

The union of the `type` strings: `'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'slot'`.

### `TextField`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `type` | `'text'` | Single-line input. Value type `string`. |
| `label` | `string` | Optional. Shown in the properties panel. |

### `TextareaField`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `type` | `'textarea'` | Multi-line input. Value type `string`. |
| `label` | `string` | Optional. |
| `rows` | `number` | Optional. Visible rows. |

### `NumberField`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `type` | `'number'` | Numeric input. Value type `number`. |
| `label` | `string` | Optional. |
| `min` | `number` | Optional. The panel clamps to it and `validateData` enforces it. |
| `max` | `number` | Optional. The panel clamps to it and `validateData` enforces it. |
| `step` | `number` | Optional. The panel snaps typed values to it. `validateData` does not check it. |

### `SelectField`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `type` | `'select'` | Dropdown. Value type is the union of the option values. |
| `label` | `string` | Optional. |
| `options` | `{ label: string, value: string \| number }[]` | The choices. |

### `BooleanField`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `type` | `'boolean'` | Toggle. Value type `boolean`. |
| `label` | `string` | Optional. |

### `SlotField`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `type` | `'slot'` | Holds child components. Value type `ComponentData[]`. |
| `label` | `string` | Optional. |
| `allow` | `readonly string[]` | Optional. Component types allowed here. Without it, any registered type is allowed. |

The component must render `<slot name="fieldName" />`. See [Slots and allow lists](../guides/slots).

### `ComponentData`

Entry points: `gissen`, `gissen/render`

One node in the page tree.

| Member | Type | Description |
|---|---|---|
| `type` | `string` | A key of `config.components`. |
| `props` | `TProps & { id: string }` | The field values plus the node's `id`. Slot fields hold `ComponentData[]`. |

### `RootData`

Entry points: `gissen`, `gissen/render`

| Member | Type | Description |
|---|---|---|
| `props` | `TProps` | The root's props. |

### `GissenData`

Entry points: `gissen`, `gissen/render`

The saved document.

| Member | Type | Description |
|---|---|---|
| `version` | `number` | Optional. `createEmptyData` sets it to `1`. Nothing reads it yet. |
| `root` | `RootData` | The root props. |
| `content` | `ComponentData[]` | The top-level components. |

### `InferFieldType`

Entry points: `gissen`, `gissen/render`

`InferFieldType<F>` maps one field config to its value type: `string` for `text` and `textarea`, `number`, `boolean`, the union of option values for `select`, and `ComponentData[]` for `slot`.

### `InferComponentProps`

Entry points: `gissen`, `gissen/render`

`InferComponentProps<Fields>` applies `InferFieldType` to every entry of a `fields` record. `defaultProps` is typed with it.

### `InferRenderProps`

Entry points: `gissen`, `gissen/render`

`InferRenderProps<Fields>` is the props object a component receives: every non-slot field, all optional, plus a required `id: string`. Slot fields are left out because they arrive as named slots.

## CSS custom properties

Set these on `:root`, or on any ancestor of the editor, after importing `gissen/style.css`. See [The editor](../guides/editor#theming).

| Variable | Default | Used for |
|---|---|---|
| `--gissen-accent` | `#4f46e5` | Focus and selection outlines, drag highlight, hover borders and text. |
| `--gissen-accent-light` | `#e0e7ff` | Hover and active backgrounds. |
| `--gissen-bg` | `#ffffff` | Editor background. |
| `--gissen-surface` | `#f8f9fa` | Sidebar and panel background. |
| `--gissen-border` | `#e2e8f0` | Borders. |
| `--gissen-border-strong` | `#cbd5e1` | Dashed borders of the empty canvas and empty slots. |
| `--gissen-text` | `#1e293b` | Primary text. |
| `--gissen-text-muted` | `#64748b` | Secondary text. |
| `--gissen-text-faint` | `#94a3b8` | Disabled toolbar buttons and the hints in empty canvases and slots. |
| `--gissen-node-outline` | `2px solid var(--gissen-accent)` | Focus rings of sidebar items, toolbar buttons, the canvas and node actions. A full `outline` value. |
| `--gissen-danger` | `#dc2626` | Text of the delete button on a selected node, on hover. |
| `--gissen-danger-light` | `#fee2e2` | Background of the delete button on a selected node, on hover. |
| `--gissen-radius` | `4px` | Corner radius. |
| `--gissen-sidebar-width` | `260px` | Width of the left sidebar. |
| `--gissen-panel-width` | `300px` | Width of the properties panel. |
