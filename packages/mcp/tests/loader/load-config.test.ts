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

  it('rejects a config whose defaultProps is out of its own field\'s range, naming the component and field', async () => {
    const configPath = path.join(fixturesDir, 'out-of-range-default.config.ts')
    await expect(loadGissenConfig(configPath)).rejects.toThrow(ConfigLoadError)
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/Hero/)
    await expect(loadGissenConfig(configPath)).rejects.toThrow(/level/)
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

  // Regression pin: the repo's own Nuxt example is what the live demo runs
  // (`pnpm --filter basic-nuxt dev` in one window, this server pointed at the
  // same `examples/basic-nuxt/page.json` in another), so its config must keep
  // loading standalone — no Vue, no build pipeline, no Nuxt auto-imports.
  // That holds only because the config imports nothing but `gissen` and
  // `.vue` files: a build-time auto-import (`defineComponent`/`h` used
  // without importing them, as the example's root render once did) or any
  // other runtime dependency would break it, and break the demo with it.
  it('loads the repo\'s real Nuxt example config standalone, as the live demo needs', async () => {
    const config = await loadGissenConfig(path.join(repoRoot, 'examples', 'basic-nuxt', 'gissen.config.ts'))
    expect(Object.keys(config.components).sort()).toEqual(['Container', 'FeatureCard', 'Hero', 'TextBlock'])
  })
})
