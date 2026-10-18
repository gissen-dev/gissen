# basic-nuxt

A runnable Nuxt 4 app using Gissen, with two routes over one document:

- **`/`** — `GissenEditor`, the drag-and-drop canvas.
- **`/render`** — `GissenRender` from the `gissen/render` subpath, server-rendered: the production path, with none of the editor stack in the bundle.

```bash
pnpm --filter basic-nuxt dev
```

## `page.json` is the store

Both routes read [`page.json`](./page.json) — the plain JSON a real app would keep in its database. It is imported as a module, so Vite watches it: change the file and the dev server pushes the new page to the browser.

The editor does **not** write back to it. Changes made on the canvas live in memory only, and a reload returns to the file.

## The live agent demo

Because `page.json` is a file and the dev server watches it, an agent holding [`gissen-mcp`](../../packages/mcp) can edit this page while you watch it in the browser. Point an MCP client at this example — `~/Library/Application Support/Claude/claude_desktop_config.json` for Claude Desktop, `.cursor/mcp.json` for Cursor — using absolute paths:

```json
{
  "mcpServers": {
    "gissen": {
      "command": "npx",
      "args": [
        "-y",
        "gissen-mcp@0.1.0-alpha.0",
        "--config",
        "/absolute/path/to/examples/basic-nuxt/gissen.config.ts",
        "--data",
        "/absolute/path/to/examples/basic-nuxt/page.json"
      ]
    }
  }
}
```

Keep `/render` open next to the agent and ask it to add or edit a block: it writes `page.json`, Vite reloads, the page updates. The agent is held to this example's own [`gissen.config.ts`](./gissen.config.ts) — it can only use the four registered component types, with the fields and select options declared there.

## Why the root wrapper is a `.vue` file

`gissen-mcp` loads `gissen.config.ts` standalone — no Vue, no build pipeline, no Nuxt auto-imports — replacing every `.vue` and CSS import with an inert stub. So the config imports nothing but `gissen` and `.vue` files, and the page root's markup lives in [`components/PageRoot.vue`](./components/PageRoot.vue) rather than in an inline `defineComponent`/`h` the way Nuxt's auto-imports would allow. A config that reaches for a runtime dependency still works in the app but stops working for the agent.
