import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCliArgs } from '../src/args'
import { CliUsageError } from '../src/errors'

describe('parseCliArgs', () => {
  it('resolves --config and --data to absolute paths', () => {
    const result = parseCliArgs(['--config', 'a.config.ts', '--data', 'a.json'])
    expect(result.configPath).toBe(path.resolve(process.cwd(), 'a.config.ts'))
    expect(result.dataPath).toBe(path.resolve(process.cwd(), 'a.json'))
  })

  it('leaves an already-absolute path untouched', () => {
    const result = parseCliArgs(['--config', '/tmp/a.config.ts', '--data', '/tmp/a.json'])
    expect(result.configPath).toBe('/tmp/a.config.ts')
    expect(result.dataPath).toBe('/tmp/a.json')
  })

  it('rejects a missing --config', () => {
    expect(() => parseCliArgs(['--data', 'a.json'])).toThrow(CliUsageError)
    expect(() => parseCliArgs(['--data', 'a.json'])).toThrow(/--config/)
  })

  it('rejects a missing --data', () => {
    expect(() => parseCliArgs(['--config', 'a.config.ts'])).toThrow(CliUsageError)
    expect(() => parseCliArgs(['--config', 'a.config.ts'])).toThrow(/--data/)
  })

  it('rejects an unrecognized flag', () => {
    expect(() => parseCliArgs(['--config', 'a.config.ts', '--data', 'a.json', '--bogus'])).toThrow(CliUsageError)
  })
})
