import type { DocumentContext } from '../../src/document/types'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildGrammar } from '../../src/grammar/build-grammar'
import { loadGissenConfig } from '../../src/loader/load-config'

const fixturesConfigDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'config')

/** Loads one of the committed fixture configs through the real Phase A loader, for tests that need a genuinely-loaded (not hand-built) `DocumentContext`. */
export async function loadFixtureDocumentContext(fixtureFileName: string): Promise<DocumentContext> {
  const config = await loadGissenConfig(path.join(fixturesConfigDir, fixtureFileName))
  return { config, grammar: buildGrammar(config) }
}
