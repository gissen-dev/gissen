import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { run } from '../src/run'

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const validConfig = path.join(fixturesDir, 'config', 'gissen.config.ts')
const malformedConfig = path.join(fixturesDir, 'config', 'malformed.config.ts')
const validData = path.join(fixturesDir, 'data', 'valid.gissen-data.json')

let stdoutSpy: ReturnType<typeof vi.spyOn>
let stderrSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
})

afterEach(() => {
  stdoutSpy.mockRestore()
  stderrSpy.mockRestore()
})

describe('run', () => {
  it('returns 0 and prints the grammar to stderr only, never stdout, on the happy path', async () => {
    const code = await run(['--config', validConfig, '--data', validData])

    expect(code).toBe(0)
    expect(stdoutSpy).not.toHaveBeenCalled()
    expect(stderrSpy).toHaveBeenCalled()
    const stderrOutput = stderrSpy.mock.calls.map(call => call[0]).join('')
    expect(stderrOutput).toContain('Hero')
  })

  it('returns 1 and reports the missing flag when args are incomplete', async () => {
    const code = await run(['--config', validConfig])

    expect(code).toBe(1)
    const stderrOutput = stderrSpy.mock.calls.map(call => call[0]).join('')
    expect(stderrOutput).toContain('--data')
  })

  it('returns 1 and names the file for a malformed config', async () => {
    const code = await run(['--config', malformedConfig, '--data', validData])

    expect(code).toBe(1)
    const stderrOutput = stderrSpy.mock.calls.map(call => call[0]).join('')
    expect(stderrOutput).toContain('malformed.config.ts')
  })

  it('returns 1 and names the path for an unreadable data file', async () => {
    const missingData = path.join(fixturesDir, 'data', 'does-not-exist.json')
    const code = await run(['--config', validConfig, '--data', missingData])

    expect(code).toBe(1)
    const stderrOutput = stderrSpy.mock.calls.map(call => call[0]).join('')
    expect(stderrOutput).toContain('does-not-exist.json')
  })
})
