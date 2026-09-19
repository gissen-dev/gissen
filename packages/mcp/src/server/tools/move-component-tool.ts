import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ServerContext } from '../context'
import { moveComponent } from '../../document/move-component'
import { runMutation } from '../document-pipeline'
import { buildMoveComponentShape } from '../schemas'
import { formatMoveComponentSuccess } from '../success-messages'
import { toToolError, toToolText } from '../tool-result'

export function registerMoveComponentTool(server: McpServer, context: ServerContext): void {
  server.registerTool('move_component', {
    description: `Move an existing component, with its whole subtree, to a different place in the page.\n\n`
      + `Destination: omit parentId to move to the top level. To move inside another `
      + `component, give parentId AND the name of a slot field on that parent. Omit index to `
      + `append. The destination slot's accepts-list is enforced — see add_component's `
      + `description for what each slot accepts.\n\n`
      + `A component cannot be moved into itself or into any of its own descendants. `
      + `Writes the data file on success.`,
    inputSchema: buildMoveComponentShape(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (args) => {
    try {
      const result = await runMutation(context, (data, ctx) => moveComponent(data, ctx, args))
      return toToolText(formatMoveComponentSuccess(args.id, result, context.dataPath))
    }
    catch (error) {
      return toToolError(error, { dataPath: context.dataPath, mutating: true })
    }
  })
}
