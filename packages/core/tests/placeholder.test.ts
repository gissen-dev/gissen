import { describe, expect, it } from 'vitest'
import { defineGissenConfig } from '../src'

describe('defineGissenConfig', () => {
  it('returns the config object it is given', () => {
    const config = defineGissenConfig({ components: {} })

    expect(config).toEqual({ components: {} })
  })
})
