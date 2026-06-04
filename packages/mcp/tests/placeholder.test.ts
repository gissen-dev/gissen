import { describe, expect, it } from 'vitest'
import { NOT_IMPLEMENTED_MESSAGE } from '../src/messages'

describe('gissen-mcp', () => {
  it('exposes a not-implemented placeholder message', () => {
    expect(NOT_IMPLEMENTED_MESSAGE).toContain('not yet implemented')
  })
})
