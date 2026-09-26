import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ConfigLoadError } from '../../src/errors'
import { loadGissenConfig } from '../../src/loader/load-config'

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'config')
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')

describe('loadGissenConfig', () => {
  it('loads the dedicated fixture config, resolving .vue/.css imports to stubs', async () => {
    const config = await loadGissenConfig(path.join(fixturesDir, 'gissen.config.ts'))
    expect(Object.keys(config.components).sort()).toEqual(['Container', 'Freeform', 'Hero'])
    expect(config.components.Hero?.fields.title).toEqual({ type: 'text', label: 'Title' })
    expect(config.components.Container?.fields.children).toMatchObject({ type: 'slot', allow: ['Hero'] })
    expect(config.root?.fields?.siteName).toEqual({ type: 'text', label: 'Site name' })
  })

  it('rejects a config with a reserved field key, naming the file and the cause', async () => {
    const configPath = path.join(fixturesDir, 'malformed.config.ts')
    await expect(loadGissenConfig(configPath)).rejects.toThrow(ConfigLoadError)
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/malformed\.config\.ts/)
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/reserved/)
  })

  it('rejects a config that throws during module evaluation, naming the file', async () => {
    const configPath = path.join(fixturesDir, 'reference-error.config.ts')
    await expect(loadGissenConfig(configPath)).rejects.toThrow(ConfigLoadError)
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/reference-error\.config\.ts/)
  })

  it('rejects a missing config file, naming the file', async () => {
    const configPath = path.join(fixturesDir, 'does-not-exist.config.ts')
    await expect(loadGissenConfig(configPath)).rejects.toThrow(ConfigLoadError)
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/does-not-exist\.config\.ts/)
  })

  // Regression pin: `rewriteStubImports` deliberately does not rewrite
  // `export ... from` re-exports of a stub-extension file (see its doc
  // comment) — jiti then tries to resolve the real `.vue` file and fails.
  // This must stay a loud, instructive failure; if a future regex change
  // silently started stubbing re-exports too (or, worse, silently dropped
  // them), this test would catch the resulting behavior change either way.
  it('rejects a re-export of a stub-extension file, failing loudly rather than silently', async () => {
    const configPath = path.join(fixturesDir, 'reexport.config.ts')
    await expect(loadGissenConfig(configPath)).rejects.toThrow(ConfigLoadError)
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/\.vue/)
  })

  // Regression pin: examples/basic-nuxt/gissen.config.ts calls
  // `defineComponent`/`h` without importing them — Nuxt supplies both as
  // build-time auto-imports, unavailable when the config is loaded
  // standalone via jiti/Node. This isn't something Phase A fixes (that would
  // mean editing the example app); it's documented here so a future change
  // that accidentally "fixes" it is noticed rather than silently drifting.
  it('documents that the repo\'s real Nuxt example config cannot load standalone', async () => {
    const configPath = path.join(repoRoot, 'examples', 'basic-nuxt', 'gissen.config.ts')
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/defineComponent/)
  })
})
