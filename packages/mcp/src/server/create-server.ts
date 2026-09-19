import type { ServerContext } from './context'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAddComponentTool } from './tools/add-component-tool'
import { registerDeleteComponentTool } from './tools/delete-component-tool'
import { registerMoveComponentTool } from './tools/move-component-tool'
import { registerReadPageTool } from './tools/read-page-tool'
import { registerUpdateComponentTool } from './tools/update-component-tool'

// Hand-synced with package.json's version. A runtime read of
// "../../package.json" relative to import.meta.url would work too, but adds
// a startup file read and would silently break if tsup's output layout ever
// changes — a hardcoded constant with this comment is the smaller risk.
const SERVER_VERSION = '0.0.0'

/** Builds the MCP server and registers exactly the five tools the brief locks in place. */
export function createGissenServer(context: ServerContext): McpServer {
  const server = new McpServer({ name: 'gissen-mcp', version: SERVER_VERSION })

  registerReadPageTool(server, context)
  registerAddComponentTool(server, context)
  registerUpdateComponentTool(server, context)
  registerDeleteComponentTool(server, context)
  registerMoveComponentTool(server, context)

  return server
}
