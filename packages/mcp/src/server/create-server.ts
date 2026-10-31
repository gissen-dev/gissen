import type { ServerContext } from './context'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAddComponentTool } from './tools/add-component-tool'
import { registerDeleteComponentTool } from './tools/delete-component-tool'
import { registerMoveComponentTool } from './tools/move-component-tool'
import { registerReadPageTool } from './tools/read-page-tool'
import { registerUpdateComponentTool } from './tools/update-component-tool'

// Injected from package.json at build time (see build-version.ts), so the
// version a client sees in the handshake cannot go stale. A runtime read of
// package.json would add a startup file read and break if tsup's output
// layout changed.
const SERVER_VERSION = __GISSEN_MCP_VERSION__

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
