# gissen-mcp

> The headless visual editor for Vue. Agent-native, self-hostable, MIT-licensed.

> **Pre-alpha — APIs are unstable.**

`gissen-mcp` is a Model Context Protocol server that lets an AI agent read and edit a Gissen page tree on disk. It's constrained by your own [`gissen`](https://www.npmjs.com/package/gissen) config: the component types, fields, select options, and slot `allow` lists you've declared become the tool schemas the agent sees — an agent can only build with the components you've registered, and every rejected edit names what was wrong and what's available instead.

## Setup

Nothing to install — your MCP client spawns the server through `npx`, which fetches and caches it on first run:

```bash
npx gissen-mcp --config ./gissen.config.ts --data ./page.json
```

You supply two files from your own project: the `gissen.config.ts` that declares your components (this is what constrains the agent), and the JSON file holding the page tree it may edit.

While the package is pre-alpha, `latest` moves with every release. Pin an exact version in long-lived client configs if you'd rather upgrade deliberately: `gissen-mcp@0.1.0-alpha.0`.

## Connect it to Claude Desktop

Edit the config file (create it if it doesn't exist yet):

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

## Connect it to Cursor

Same shape, in `.cursor/mcp.json` (project-local) or `~/.cursor/mcp.json` (global):

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

## CLI usage

```bash
npx gissen-mcp --config <path-to-gissen.config.ts> --data <path-to-data.json>
npx gissen-mcp --help
```

Both flags are required and must be absolute or resolvable from the current directory — in a client config, always absolute: the client decides the working directory, not you. On startup the process loads and validates your config, prints its derived grammar to stderr, then serves the five tools below over stdio until the client disconnects. Stdout carries only JSON-RPC — all logging goes to stderr, so it's safe to pipe stdout straight into an MCP client.

## The config constraint

Your `gissen.config.ts` is loaded with [`jiti`](https://github.com/unjs/jiti), not your app's own build pipeline — the server only ever needs `fields` and `allow` from your config, never `render`, so `.vue`/CSS/image imports are replaced with inert stubs at load time. Two consequences:

- **The config file must be free of side effects other than the `defineGissenConfig` call.** A config that depends on build-time auto-imports (for example, calling `defineComponent`/`h` without importing them, the way Nuxt's auto-imports allow) will fail to load standalone — it needs the same explicit imports it would need anywhere outside your app's build tool.
- **`render` is never invoked.** Component logic, styles, and template markup are irrelevant to this server; only the field declarations and slot `allow` lists matter.

## Tools

- **`read_page`** — returns the current page tree and the grammar (so an agent that calls only this tool still knows what it may do). Re-reads the data file fresh every call.
- **`add_component`** — inserts a new component of a registered type, at the top level or inside a declared slot.
- **`update_component`** — sets field values on an existing component by id. Values are type-checked, never coerced; `null` clears a field.
- **`delete_component`** — removes a component and everything nested inside it.
- **`move_component`** — relocates a component, with its subtree, to a different place in the page.

Every mutation reads the data file fresh, applies the change, validates the result, and writes atomically — a rejected edit never touches the file. Every rejection is instructive: it names what was wrong (an unknown type, an out-of-range value, a slot that doesn't accept that component) and lists what's actually available, so an agent can self-correct without another round trip.

## Documentation

Full docs at **[gissen.dev](https://gissen.dev)**.

## License

[MIT](https://github.com/gissen-dev/gissen/blob/main/LICENSE)
