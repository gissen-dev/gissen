import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { run } from '../src/run'

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const validConfig = path.join(fixturesDir, 'config', 'gissen.config.ts')
const malformedConfig = path.join(fixturesDir, 'config', 'malformed.config.ts')
const outOfRangeDefaultConfig = path.join(fixturesDir, 'config', 'out-of-range-default.config.ts')
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
  // The happy path now blocks inside serveOverStdio() until the transport
  // closes, so it can no longer be exercised as a simple "call run() and
  // check the return value" unit test — that coverage (including stdout
  // purity, now proven against a real pipe rather than a spy) moved to
  // tests/integration/stdio-server.test.ts. The failure paths below never
  // reach serve(), so they're unaffected and stay here.

  // `--help` is the one path that legitimately writes to stdout: it never
  // builds a transport, so there is no JSON-RPC stream to keep clean. It also
  // has to work without the two flags every other invocation requires.
  it.each(['--help', '-h'])('prints help to stdout and exits 0 for %s', async (flag) => {
    const code = await run([flag])

    expect(code).toBe(0)
    const stdoutOutput = stdoutSpy.mock.calls.map(call => call[0]).join('')
    expect(stdoutOutput).toContain('Usage: gissen-mcp')
    expect(stdoutOutput).toContain('--config')
    expect(stdoutOutput).toContain('--data')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('answers help even when the serving flags are also present', async () => {
    const code = await run(['--config', validConfig, '--data', validData, '--help'])

    expect(code).toBe(0)
    const stdoutOutput = stdoutSpy.mock.calls.map(call => call[0]).join('')
    expect(stdoutOutput).toContain('Usage: gissen-mcp')
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

  // `validateConfig` now range-checks `defaultProps` (docs/devlog/phase-7.md,
  // "validateConfig doesn't range-check defaultProps"), so a config declaring
  // an out-of-range default fails at startup, before any transport is built.
  // `createNode` used to carry its own `InvalidDefaultPropError` guard for
  // exactly this case, added back when only `gissen-mcp` caught it; that
  // guard is gone now that this fails earlier, at config load.
  it('refuses to start and names the component and field for an out-of-range defaultProps value', async () => {
    const code = await run(['--config', outOfRangeDefaultConfig, '--data', validData])

    expect(code).toBe(1)
    const stderrOutput = stderrSpy.mock.calls.map(call => call[0]).join('')
    expect(stderrOutput).toContain('Hero')
    expect(stderrOutput).toContain('level')
  })

  it('returns 1 and names the path for an unreadable data file', async () => {
    const missingData = path.join(fixturesDir, 'data', 'does-not-exist.json')
    const code = await run(['--config', validConfig, '--data', missingData])

    expect(code).toBe(1)
    const stderrOutput = stderrSpy.mock.calls.map(call => call[0]).join('')
    expect(stderrOutput).toContain('does-not-exist.json')
  })
})
