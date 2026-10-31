# gissen-mcp

An MCP server that lets an AI agent read and edit a Gissen page, held to your Gissen config.

Gissen is in alpha. APIs can change between releases. Do not use it in production.

The agent can add the component types you registered and set the fields you declared, and nothing else. Every refused edit says what was wrong and what is allowed.

## Use it

Nothing to install. Your MCP client starts the server through `npx`:

```sh
npx gissen-mcp --config /absolute/path/to/gissen.config.ts --data /absolute/path/to/page.json
```

In Claude Desktop (`claude_desktop_config.json`) or Cursor (`.cursor/mcp.json`):

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

Both paths must be absolute: the client decides the working directory.

## Documentation

- [MCP guide](https://gissen.dev/agents/mcp): setup, how the config constrains the agent, every error message, and the limitations.
- [API reference](https://gissen.dev/api/gissen-mcp): the flags and the five tools.
- [examples/mcp-agent](https://github.com/gissen-dev/gissen/tree/main/examples/mcp-agent): a page that updates live as an agent edits it.

## License

[MIT](https://github.com/gissen-dev/gissen/blob/main/LICENSE)
