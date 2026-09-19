import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import type { FailureContext } from './failure-messages'
import { formatToolFailure } from './failure-messages'

export function toToolText(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] }
}

/**
 * Builds an `isError: true` result rather than the handler throwing. The
 * wire result is identical either way — `McpServer` converts a thrown
 * `Error` into the same shape — but returning keeps these long, multi-line,
 * agent-facing messages out of `Error.message` (which would conflate a log
 * line with an instruction) and lets `formatToolFailure` use the tool's own
 * `mutating` flag.
 *
 * A schema-level rejection the SDK makes on its own — e.g. `add_component`
 * called with a `type` outside its enum — never reaches this function
 * either, but NOT because it propagates as a distinguishable protocol
 * fault: `registerTool` validates arguments before invoking the handler,
 * and its own internal try/catch converts that failure into an ordinary
 * `isError: true` result the same shape as this one, just with the SDK's
 * own Zod-validation wording rather than this codebase's instructive
 * templates. Known, accepted gap: the type name has to live in the Zod
 * enum for `tools/list` to advertise it (decision 5), which means the
 * SDK — not `formatToolFailure` — is what an agent sees for that one
 * rejection shape.
 */
export function toToolError(error: unknown, ctx: FailureContext): CallToolResult {
  return { content: [{ type: 'text', text: formatToolFailure(error, ctx) }], isError: true }
}
