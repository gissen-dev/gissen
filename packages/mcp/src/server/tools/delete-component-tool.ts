import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ServerContext } from '../context'
import { deleteComponent } from '../../document/delete-component'
import { runMutation } from '../document-pipeline'
import { buildDeleteComponentShape } from '../schemas'
import { formatDeleteComponentSuccess } from '../success-messages'
import { toToolError, toToolText } from '../tool-result'

export function registerDeleteComponentTool(server: McpServer, context: ServerContext): void {
  server.registerTool('delete_component', {
    description: `Delete one component and everything nested inside it.\n\n`
      + `Irreversible — this server has no undo and no history. The deleted component's id `
      + `and every descendant id stop existing, and the data file is rewritten. The response `
      + `lists every id that was removed so you can drop them from your working set.`,
    inputSchema: buildDeleteComponentShape(),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  }, async (args) => {
    try {
      const result = await runMutation(context, (data, ctx) => deleteComponent(data, ctx, { id: args.id }))
      return toToolText(formatDeleteComponentSuccess(result, context.dataPath))
    }
    catch (error) {
      return toToolError(error, { dataPath: context.dataPath, mutating: true })
    }
  })
}
