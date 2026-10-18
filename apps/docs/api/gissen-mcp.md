# gissen-mcp

<GissenStatus />

`gissen-mcp` is an MCP server that lets an AI agent read and edit one Gissen page file. It talks over stdio. The agent can only create the component types and set the fields that your config declares.

```sh
npx gissen-mcp --config /absolute/path/gissen.config.ts --data /absolute/path/page.json
```

This page lists the flags, exit codes and tools.

## CLI flags

### `--config`

Required. Path to your Gissen config module. It must call `defineGissenConfig` and export the result as the default export.

- The server loads the config, then builds its tools from it. See the note on component types under [Tools](#tools).
- The path is resolved against the current working directory. In an MCP client config, use an absolute path.
- The server writes a summary of what the config allows to stderr when it starts.

### `--data`

Required. Path to the JSON file that holds the page, in the `GissenData` format. The file must already exist and match your config. An empty page is `{ "version": 1, "root": { "props": {} }, "content": [] }`.

- The path is resolved against the current working directory. In an MCP client config, use an absolute path.
- The server reads the file again on every tool call, so edits you make by hand or from another tool are picked up.
- Every successful change rewrites the whole file. The write is atomic: the file is replaced or left alone.

### `--help`

Alias: `-h`. Prints the usage text to stdout and exits with code 0. It works without the other flags.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Help was printed, or the client closed the connection. |
| `1` | A flag is missing or unknown, the data file cannot be read, or the config cannot be loaded or is invalid. The reason is written to stderr. |

While the server runs, stdout carries only JSON-RPC. Everything else goes to stderr.

## Tools

The server registers these five tools. Names and arguments are fixed. The component types that `add_component` accepts, and the fields that `update_component` accepts, come from your config.

Every tool refuses a request that would produce a page your config does not accept. A refused request leaves the file unchanged and returns an error message that says what to fix.

### `read_page`

Returns the current page and a description of what each component type allows. It takes no arguments.

Call it first, because the other tools identify components by `id`.

### `add_component`

Adds a new component with its configured `defaultProps` and a new `id`. Writes the file.

| Argument | Type | Required | Description |
|---|---|---|---|
| `type` | `string` | yes | A component type from your config. The tool schema lists the valid types, and names are case-sensitive. |
| `parentId` | `string` or `null` | no | The `id` of the component to add into. Omit it or pass `null` to add at the top level. |
| `slot` | `string` or `null` | no | The slot field on `parentId` to add into. Required with `parentId`, rejected without it. |
| `index` | `integer` | no | Zero-based position among the destination's children. Omit it to append. |

The tool cannot set props. Call `update_component` after it.

### `update_component`

Sets field values on one component. Writes the file.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | yes | The `id` of the component, from `read_page` or `add_component`. |
| `props` | `object` | yes | Field values keyed by field name. `null` clears a field. Slot fields and `id` cannot be set. |

- Values are checked against the field type and are never converted. A number field needs a JSON number.
- Either every entry in `props` is applied or none is.
- `null` clears `text` and `textarea` fields to `""`. For every other type it removes the value.

### `delete_component`

Deletes a component and everything inside it. Writes the file. There is no undo.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | yes | The `id` of the component to delete. |

The response lists every `id` that was removed.

### `move_component`

Moves a component, with its subtree, to another place in the page. Writes the file.

| Argument | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | yes | The `id` of the component to move. |
| `parentId` | `string` or `null` | no | The `id` of the component to move into. Omit it or pass `null` for the top level. |
| `slot` | `string` or `null` | no | The slot field on `parentId` to move into. Required with `parentId`, rejected without it. |
| `index` | `integer` | no | Zero-based position among the destination's children, counted before the component is detached. Omit it to append. |

The destination slot's `allow` list is enforced. A component cannot be moved into itself or into one of its own descendants.
