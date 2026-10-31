import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ConfigLoadError } from '../../src/errors'
import { loadGissenConfig } from '../../src/loader/load-config'
import { rewriteStubImports } from '../../src/loader/rewrite-stub-imports'

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

  // Regression pin: examples/nuxt-ssr keeps its field schema in schema.ts so
  // that one file serves two consumers that cannot load Vue: the example's
  // Nitro server route, which validates writes against it, and this server.
  // The pin checks the schema itself, not the full gissen.config.ts: that
  // one also loads here, but only because its `.vue` imports are swapped for
  // stubs, which would prove the workaround rather than the split. So the
  // schema must load with nothing rewritten at all. A `.vue` import, or a
  // build-time auto-import such as `defineComponent`/`h` used without an
  // import, would break both of its consumers at once.
  it('loads the Nuxt example\'s schema.ts standalone, with no import rewritten', async () => {
    const schemaPath = path.join(repoRoot, 'examples', 'nuxt-ssr', 'schema.ts')
    const source = await readFile(schemaPath, 'utf8')
    expect(rewriteStubImports(source)).toBe(source)
    const config = await loadGissenConfig(schemaPath)
    expect(Object.keys(config.components).sort()).toEqual(['Container', 'FeatureCard', 'Hero', 'TextBlock'])
  })
})
