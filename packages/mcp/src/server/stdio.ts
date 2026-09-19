import type { ServerContext } from './context'
import process from 'node:process'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { serve } from './serve'

/**
 * `StdioServerTransport.start()` (verified against the installed SDK) only
 * subscribes to stdin's `'data'` and `'error'` events — it never observes
 * EOF. Without this bridge, a client closing its end of the pipe would
 * leave `serve` waiting forever, and the process would exit only because no
 * handles remain — skipping our own shutdown path and leaving
 * `process.exitCode` never assigned, which would make `run()`'s exit-code
 * contract vestigial rather than real.
 */
export async function serveOverStdio(context: ServerContext): Promise<void> {
  const transport = new StdioServerTransport()
  process.stdin.once('end', () => {
    void transport.close()
  })
  await serve(context, transport)
}
