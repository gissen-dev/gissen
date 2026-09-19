import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ServerContext } from '../context'
import { addComponent } from '../../document/add-component'
import { runMutation } from '../document-pipeline'
import { describeComponentTypes } from '../grammar-prose'
import { buildAddComponentShape } from '../schemas'
import { formatAddComponentSuccess } from '../success-messages'
import { toToolError, toToolText } from '../tool-result'

export function registerAddComponentTool(server: McpServer, context: ServerContext): void {
  server.registerTool('add_component', {
    description: `Add a new component of a registered type to the page. It is created with this `
      + `project's configured default props; use update_component afterwards to set fields.\n\n`
      + `Component types you may add:\n${describeComponentTypes(context.document.grammar)}\n\n`
      + `Placement: omit parentId to add at the top level of the page. To add inside another `
      + `component, give parentId AND the name of a slot field on that parent — a parentId `
      + `without a slot is rejected, and slot is not accepted without a parentId. Omit index `
      + `to append.\n\nWrites the data file on success.`,
    inputSchema: buildAddComponentShape(context.document.grammar),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async (args) => {
    try {
      const result = await runMutation(context, (data, ctx) => addComponent(data, ctx, args))
      return toToolText(formatAddComponentSuccess(result, context.document.grammar, context.dataPath))
    }
    catch (error) {
      return toToolError(error, { dataPath: context.dataPath, mutating: true })
    }
  })
}
