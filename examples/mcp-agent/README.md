# mcp-agent

A page an AI agent edits directly, with the running app updating on every write, no manual reload.

- `gissen.config.ts` and `page.json` sit at the project root. Point `gissen-mcp` at both.
- `src/App.vue` renders `page.json` through `GissenRender`. There is no editor UI here; the editing happens outside the browser, through the agent.
- `src/page-store.ts` imports `page.json` and self-accepts its own Hot Module Replacement update. When `gissen-mcp` rewrites the file, Vite re-executes this one module instead of reloading the page, and the new data replaces the old in place.

## Run it

```sh
npm install
npm run dev
```

Open the printed URL, then connect an MCP client to the same project.

### Claude Desktop

Add this to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`; Windows: `%APPDATA%\Claude\claude_desktop_config.json`), with absolute paths for your clone:

```json
{
  "mcpServers": {
    "gissen": {
      "command": "npx",
      "args": [
        "-y",
        "gissen-mcp",
        "--config",
        "/absolute/path/to/mcp-agent/gissen.config.ts",
        "--data",
        "/absolute/path/to/mcp-agent/page.json"
      ]
    }
  }
}
```

Restart Claude Desktop, then ask it to add a `Note` or change the `Hero`'s title. Watch the browser tab update without a reload.

### Cursor

Same shape, in `.cursor/mcp.json` (project-local) or `~/.cursor/mcp.json`.

## Open in StackBlitz

[Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/mcp-agent)

StackBlitz's WebContainers run the dev server, but an external MCP client cannot reach a tab's process from outside the browser. Clone the repository to connect a real agent.
