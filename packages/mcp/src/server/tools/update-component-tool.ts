import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ServerContext } from '../context'
import { updateComponent } from '../../document/update-component'
import { runMutation } from '../document-pipeline'
import { describeComponentTypes } from '../grammar-prose'
import { buildUpdateComponentShape } from '../schemas'
import { formatUpdateComponentSuccess } from '../success-messages'
import { toToolError, toToolText } from '../tool-result'

export function registerUpdateComponentTool(server: McpServer, context: ServerContext): void {
  server.registerTool('update_component', {
    description: `Set field values on one existing component, identified by its id (get ids from `
      + `read_page or add_component).\n\n`
      + `Only the fields declared for that component's type may be set. Values are `
      + `type-checked, never coerced: send a JSON number for a number field, a JSON boolean `
      + `for a boolean field. Send null to clear a field — text and textarea clear to "", `
      + `every other type clears to unset. Slot fields cannot be set here; use `
      + `add_component, move_component or delete_component to change a component's children.\n\n`
      + `Fields by component type:\n${describeComponentTypes(context.document.grammar)}\n\n`
      + `Either every entry in props is applied or none is — a single rejected value leaves `
      + `the page completely unchanged. Writes the data file on success.`,
    inputSchema: buildUpdateComponentShape(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (args) => {
    try {
      const result = await runMutation(context, (data, ctx) =>
        updateComponent(data, ctx, { id: args.id, props: args.props }))
      return toToolText(formatUpdateComponentSuccess(args.id, result, context.document.grammar, context.dataPath))
    }
    catch (error) {
      return toToolError(error, { dataPath: context.dataPath, mutating: true })
    }
  })
}
