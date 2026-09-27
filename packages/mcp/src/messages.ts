/** Printed as part of a `CliUsageError` when required flags are missing. */
export const USAGE_MESSAGE = 'Usage: gissen-mcp --config <path-to-gissen.config.ts> --data <path-to-data.json>'

/** Printed to stdout, with exit code 0, when the CLI is invoked with `--help` / `-h`. */
export const HELP_MESSAGE = `gissen-mcp — Model Context Protocol server for Gissen.

${USAGE_MESSAGE}

Options:
  --config <path>  Gissen config module declaring the components an agent may use.
  --data <path>    JSON file holding the page tree to read and edit.
  -h, --help       Print this message and exit.

Both --config and --data are required, and are resolved against the current
working directory — in an MCP client config, always pass absolute paths.

Serves five tools (read_page, add_component, update_component,
delete_component, move_component) over stdio until the client disconnects.
Stdout carries only JSON-RPC; the derived grammar and all logging go to stderr.

Docs: https://gissen.dev`
