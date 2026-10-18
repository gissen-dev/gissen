# AI agents (MCP)

<GissenStatus />

`gissen-mcp` is a Model Context Protocol server. It lets an AI agent read and edit one Gissen page on disk, through five tools, over stdio. It is constrained by your own config: an agent can only add the component types you registered and set the fields you declared.

This page covers setup, how the constraint actually works, what an agent sees when it is refused, and the limitations. The flags and the five tools, one by one, are in the [API reference](../api/gissen-mcp).

## Setup

Nothing to install. Your MCP client spawns the server through `npx`, which fetches and caches it on first run.

### Claude Desktop

Edit the config file (create it if it does not exist):

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gissen": {
      "command": "npx",
      "args": [
        "-y",
        "gissen-mcp",
        "--config",
        "/absolute/path/to/your/gissen.config.ts",
        "--data",
        "/absolute/path/to/your/page.json"
      ]
    }
  }
}
```

Restart Claude Desktop after saving.

### Cursor

Same shape, in `.cursor/mcp.json` (project-local) or `~/.cursor/mcp.json` (global).

Both flags are required, and both paths must be absolute: the client decides the working directory, not you. See [examples/mcp-agent](https://github.com/gissen-dev/gissen/tree/main/examples/mcp-agent) for a project set up this way end to end, including a page that updates live as the agent writes to it.

## The config-as-grammar model

gissen-mcp does not have its own idea of what an agent may build. It reads your `gissen.config.ts` and derives its tool schemas from it: the component types become an enum, the fields become the arguments `update_component` accepts, and slot `allow` lists become what `add_component` and `move_component` will place where. This is the config behind every example on this page.

<<< @/snippets/agents/gissen.config.ts [gissen.config.ts]

An agent connecting to a server running this config sees `add_component`'s `type` argument restricted to exactly these three names, read straight from a real `tools/list` response:

<<< @/snippets/agents/catalogue/add-component-type-enum.json [add_component's type enum]

Change the config, and the tools change with it. There is no separate schema to keep in sync, and nothing beyond this file to tell the agent what it may do.

## What an agent sees when it is refused

Every rejection names what was wrong and, where there's a fixed list to name, what is available instead, so an agent can self-correct without another round trip. These are the exact responses the server above gives for `page.json`:

<<< @/snippets/agents/page.json [page.json]

### add_component

**Unknown component type.** `add_component` with a `type` outside the config's enum. This one does not reach Gissen's own wording: the type name has to live in the tool's JSON Schema `enum` for `tools/list` to advertise it, so the MCP SDK rejects the call before gissen-mcp's own code runs, in the SDK's own validation voice. See [Limitations](#limitations).

<<< @/snippets/agents/catalogue/add-unknown-type.txt [add_component { type: "Nope" }]

**Type not allowed in that slot.** `Container`'s `children` only allows `Card` and `Container` (see the config above); adding a `Hero` there is rejected.

<<< @/snippets/agents/catalogue/add-not-allowed-in-slot.txt [add_component { type: "Hero", parentId: "container-1", slot: "children" }]

**No such parent.**

<<< @/snippets/agents/catalogue/add-parent-not-found.txt [add_component { type: "Card", parentId: "nope", slot: "children" }]

**That field is not a slot.** `title` exists on `Hero`, but it is a `text` field.

<<< @/snippets/agents/catalogue/add-field-is-not-a-slot.txt [add_component { type: "Card", parentId: "hero-1", slot: "title" }]

**A slot name is required with a parent that has one.**

<<< @/snippets/agents/catalogue/add-slot-required.txt [add_component { type: "Card", parentId: "container-1" }]

**A slot name without a parent makes no sense.** The top level of the page has no slots.

<<< @/snippets/agents/catalogue/add-root-slot-not-applicable.txt [add_component { type: "Card", slot: "children" }]

**Index out of range.**

<<< @/snippets/agents/catalogue/add-index-out-of-range.txt [add_component { ..., index: 99 }]

### update_component

**Unknown field.**

<<< @/snippets/agents/catalogue/update-unknown-field.txt [update_component { id: "hero-1", props: { bogus: 1 } }]

**`id` is read-only.**

<<< @/snippets/agents/catalogue/update-reserved-field.txt [update_component { id: "hero-1", props: { id: "x" } }]

**Value not among the select's options.**

<<< @/snippets/agents/catalogue/update-invalid-select-value.txt [update_component { id: "card-1", props: { size: "xl" } }]

**Number out of range.**

<<< @/snippets/agents/catalogue/update-number-out-of-range.txt [update_component { id: "card-1", props: { rating: 10 } }]

**Wrong value type.** Values are never coerced.

<<< @/snippets/agents/catalogue/update-field-type-mismatch.txt [update_component { id: "hero-1", props: { title: 123 } }]

**Slot fields cannot be set here.** Use `add_component`, `move_component` or `delete_component` to change children.

<<< @/snippets/agents/catalogue/update-slot-field-not-editable.txt [update_component { id: "container-1", props: { children: [] } }]

**No such component.**

<<< @/snippets/agents/catalogue/update-node-not-found.txt [update_component { id: "nope", props: {} }]

A field holding a non-finite number (`NaN`, `Infinity`) would be rejected the same way, as "must be a finite number". It is not shown here, because JSON itself cannot carry either value, so an agent speaking JSON-RPC cannot actually trigger it.

### delete_component and move_component

**No such component.**

<<< @/snippets/agents/catalogue/delete-node-not-found.txt [delete_component { id: "nope" }]

**Moving a component into itself.**

<<< @/snippets/agents/catalogue/move-into-self.txt [move_component { id: "container-1", parentId: "container-1", slot: "children" }]

**Moving a component into its own descendant.** `page.json` above nests `container-2` inside `container-1`.

<<< @/snippets/agents/catalogue/move-into-descendant.txt [move_component { id: "container-1", parentId: "container-2", slot: "children" }]

### A malformed data file

These happen on any tool call, including `read_page`, since the file is read fresh every time.

**Duplicate ids.** Gissen's own `validateData` does not check this; gissen-mcp does, because an id has to identify exactly one component for every tool here to work.

<<< @/snippets/agents/catalogue/data-duplicate-ids.txt [a page.json with two components sharing one id]

**The file no longer matches the config.** Here, a component type the config no longer registers.

<<< @/snippets/agents/catalogue/data-mismatched-config.txt [a page.json with an unregistered component type]

**The file is not valid JSON.**

<<< @/snippets/agents/catalogue/data-invalid-json.txt [a truncated page.json]

### The server fails to start

These are not tool responses: the server never reaches a working session, so the client sees a closed connection and these lines on stderr.

**A required flag is missing.**

<<< @/snippets/agents/catalogue/start-missing-config-flag.txt [gissen-mcp --data page.json]

**An unknown flag.**

<<< @/snippets/agents/catalogue/start-unknown-flag.txt [gissen-mcp --config ... --data ... --wat]

**The config file does not exist.**

<<< @/snippets/agents/catalogue/start-config-file-missing.txt [--config /path/to/does-not-exist.ts]

**The config relies on build-time auto-imports.** This is the exact failure a real Nuxt config hits when loaded outside Nuxt: see [Limitations](#limitations) and [examples/nuxt-ssr](https://github.com/gissen-dev/gissen/tree/main/examples/nuxt-ssr).

<<< @/snippets/agents/catalogue/start-config-reference-error.txt [a config calling defineComponent/h without importing them]

**The config itself is invalid.** Here, a `defaultProps` value outside its field's own range.

<<< @/snippets/agents/catalogue/start-config-invalid.txt [a config with an out-of-range default]

**The data file does not exist.**

<<< @/snippets/agents/catalogue/start-data-file-missing.txt [--data /path/to/does-not-exist.json]

## Limitations

- **stdio and file-based only.** No HTTP transport, no database, no remote page store. The data is a JSON file on the disk the server runs on.
- **One page file per server instance.** `--data` is a single path. A multi-page site needs one running server per page, or your own tool in front of several.
- **The config file must have no side effects beyond the `defineGissenConfig` call.** It is loaded standalone with [jiti](https://github.com/unjs/jiti), not your app's build pipeline. A config written assuming Nuxt's (or any framework's) build-time auto-imports fails exactly the way the capture above shows.
- **An unknown component type is rejected by the SDK, not by Gissen.** The type name has to be in the tool's own JSON Schema `enum` for `tools/list` to advertise it; the MCP SDK validates arguments against that schema before gissen-mcp's handler ever runs, so this one rejection reaches the agent in the SDK's generic wording instead of the instructive messages shown above.
- **`.vue`/CSS/image imports in the config are stubbed, not loaded.** The server only ever needs `fields` and `allow` from your config, never `render`, so static imports ending in those extensions are rewritten to an inert stub before the file is evaluated. This works by matching import statements anchored to the start of a line, which is every shape a real config needs. It is a pattern match, not a parser. A field's own label text containing real import syntax at the very start of a line inside a multi-line string is a false positive this cannot rule out in theory; in practice it has not come up. See the comment on `rewriteStubImports` in the gissen-mcp source for the full account.
