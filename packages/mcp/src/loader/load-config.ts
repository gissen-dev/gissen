import type { GissenConfig } from 'gissen'
import { readFile } from 'node:fs/promises'
import { validateConfig } from 'gissen'
import { ConfigLoadError } from '../errors'
import { createConfigJiti } from './create-config-jiti'
import { rewriteStubImports } from './rewrite-stub-imports'

/**
 * Loads, evaluates, and validates a user's Gissen config module. Any
 * failure — the file missing, a syntax/reference error during evaluation
 * (e.g. a config relying on build-time auto-imports that aren't available
 * here), or a `validateConfig` rejection — is wrapped in one `ConfigLoadError`
 * naming `configPath`, so the caller has a single instructive error to report.
 */
export async function loadGissenConfig(configPath: string): Promise<GissenConfig> {
  try {
    const rawSource = await readFile(configPath, 'utf8')
    const rewritten = rewriteStubImports(rawSource)
    const jiti = createConfigJiti()
    const evaluated = await jiti.evalModule(rewritten, { filename: configPath, async: true })
    return validateConfig(extractDefaultExport(evaluated))
  }
  catch (cause) {
    throw new ConfigLoadError(configPath, cause)
  }
}

/** Config modules export their `defineGissenConfig(...)` result as `export default`. */
function extractDefaultExport(moduleNamespace: unknown): unknown {
  if (moduleNamespace !== null && typeof moduleNamespace === 'object' && 'default' in moduleNamespace)
    return (moduleNamespace as { default: unknown }).default
  return moduleNamespace
}
