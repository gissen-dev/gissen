# mcp-agent

A page an AI agent edits while you watch it, with no manual reload. Two views over one document:

- **Editor** (`#/`): `GissenEditor`, the drag-and-drop canvas.
- **Rendered page** (`#/render`): `GissenRender`, the page as it ships.

## Run it

```sh
npm install
npm run dev
```

Open the URL Vite prints, then connect an MCP client to the same project (below).

## `page.json` is the store

Both views read [`page.json`](./page.json), the plain JSON a real app would keep in its database. `src/page-store.ts` imports it and accepts its own Hot Module Replacement update, so when the file changes, Vite re-runs that one module and the new page replaces the old one in place. The browser does not reload.

The editor does not write back to `page.json`. Changes made on the canvas live in memory only. When the file changes, the editor switches to the new version and starts a fresh undo history.

## The live agent demo

Because `page.json` is a file and Vite watches it, an agent holding `gissen-mcp` can edit this page while you watch it in the browser. Point an MCP client at this example, using absolute paths for your clone.

Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows). Cursor: `.cursor/mcp.json` in the project, or `~/.cursor/mcp.json`. The shape is the same:

```json
{
  "mcpServers": {
    "gissen": {
      "command": "npx",
      "args": [
        "-y",
        "gissen-mcp@0.1.0-alpha.0",
        "--config",
        "/absolute/path/to/examples/mcp-agent/gissen.config.ts",
        "--data",
        "/absolute/path/to/examples/mcp-agent/page.json"
      ]
    }
  }
}
```

The version is pinned to the one in this example's `package.json`, so the agent and the app use the same release. Restart the client after saving.

Keep **Rendered page** open next to the agent and ask it to add or edit a block. It writes `page.json`, and the page updates. The agent is held to this example's own [`gissen.config.ts`](./gissen.config.ts): it can only use the four registered component types, with the fields and select options declared there.

## Why the page root is a `.vue` file

`gissen-mcp` loads `gissen.config.ts` standalone, with no Vue, no build pipeline and no framework auto-imports, and replaces every `.vue` and CSS import with an inert stub. So the config imports nothing but `gissen` and `.vue` files, and the page root's markup lives in [`src/components/PageRoot.vue`](./src/components/PageRoot.vue) rather than in an inline `defineComponent`/`h`. A config that reaches for a runtime dependency still works in the app but stops working for the agent.

## Open in StackBlitz

[Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/mcp-agent)

StackBlitz runs the dev server inside the browser tab, where an MCP client on your machine cannot reach it. Clone the repository to connect a real agent.
