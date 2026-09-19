import type { ServerContext } from '../../src/server/context'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { describe, expect, it } from 'vitest'
import { serve } from '../../src/server/serve'
import { testContext } from '../document/helpers'

describe('serve', () => {
  it('resolves once the transport closes', async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    const context: ServerContext = { dataPath: '/tmp/unused.json', document: testContext }

    const served = serve(context, serverSide)
    await clientSide.close()

    await expect(served).resolves.toBeUndefined()
  })
})
