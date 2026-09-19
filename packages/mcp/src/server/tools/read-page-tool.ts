import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ServerContext } from '../context'
import { readPage } from '../../document/read-page'
import { loadDocument } from '../document-pipeline'
import { describeComponentTypes, describeRootFields } from '../grammar-prose'
import { formatReadPageSuccess } from '../success-messages'
import { toToolError, toToolText } from '../tool-result'

export function registerReadPageTool(server: McpServer, context: ServerContext): void {
  const rootFields = describeRootFields(context.document.grammar)
  const rootLine = rootFields
    ? `\n\nPage root props (${rootFields}) are read-only through this server — no tool edits them.`
    : ''

  server.registerTool('read_page', {
    description: `Read the current Gissen page and the grammar that governs it. The data file is `
      + `re-read from disk on every call, so this always reflects the current state.\n\n`
      + `Component types in this project:\n${describeComponentTypes(context.document.grammar)}`
      + `${rootLine}\n\nCall this before mutating if you do not already know the current component ids.`,
    annotations: { readOnlyHint: true, openWorldHint: false },
    // No inputSchema: an empty raw shape `{}` is unusable with this SDK build
    // (its zod-compat layer treats an empty shape as "no schema" and then
    // tries to parse arguments against a non-schema) — omitting it entirely
    // is the documented way to declare a no-argument tool.
  }, async () => {
    try {
      const data = await loadDocument(context)
      const result = readPage(data, context.document)
      return toToolText(formatReadPageSuccess(result, context.dataPath))
    }
    catch (error) {
      return toToolError(error, { dataPath: context.dataPath, mutating: false })
    }
  })
}
