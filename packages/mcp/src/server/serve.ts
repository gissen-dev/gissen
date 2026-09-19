import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { ServerContext } from './context'
import process from 'node:process'
import { createGissenServer } from './create-server'

/**
 * Connects the server to `transport` and resolves once it closes.
 * Transport-agnostic on purpose — `transport` is a real parameter, not a
 * test hook, and `Transport` is the SDK's own abstraction, which is what
 * lets this be driven by `InMemoryTransport` in tests with no stdio
 * involved at all.
 */
export async function serve(context: ServerContext, transport: Transport): Promise<void> {
  const server = createGissenServer(context)
  const closed = new Promise<void>((resolve) => {
    server.server.onclose = resolve
  })
  await server.connect(transport)
  process.stderr.write(`gissen-mcp ready — data: ${context.dataPath}\n`)
  await closed
}
