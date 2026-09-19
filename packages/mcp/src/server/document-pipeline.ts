import type { GissenData } from 'gissen'
import type { DocumentContext } from '../document/types'
import type { ServerContext } from './context'
import { validateData } from 'gissen'
import { readDataFile, serializeData, writeDataFileAtomically } from '../data-file'
import { indexGrammar } from '../document/grammar-index'
import { assertUniqueIds } from '../document/tree'
import { DataValidationError, PostMutationValidationError } from '../errors'

/**
 * The only read path. Reads the data file fresh (decision 7 — nothing is
 * cached across calls), validates it against the loaded config, and checks
 * for duplicate component ids (Phase B's `assertUniqueIds` — the one check
 * `gissen` itself doesn't make, run once here rather than inside every
 * document operation, per decision).
 */
export async function loadDocument(context: ServerContext): Promise<GissenData> {
  const parsed = await readDataFile(context.dataPath)

  let data: GissenData
  try {
    data = validateData(parsed, context.document.config)
  }
  catch (cause) {
    throw new DataValidationError(context.dataPath, cause)
  }

  assertUniqueIds(data, indexGrammar(context.document.grammar))
  return data
}

/**
 * The only write path. Reads fresh, applies `operation`, validates the
 * RESULT ("never write a tree that fails `validateData`" — decision 6), then
 * writes atomically. `operation` throwing (a Phase B `DocumentError`) leaves
 * the data file untouched — nothing between `loadDocument` and the write
 * mutates anything outside the clone `operation` itself returns.
 */
export async function runMutation<TResult extends { data: GissenData }>(
  context: ServerContext,
  operation: (data: GissenData, ctx: DocumentContext) => TResult,
): Promise<TResult> {
  const data = await loadDocument(context)
  const result = operation(data, context.document)

  try {
    validateData(result.data, context.document.config)
  }
  catch (cause) {
    throw new PostMutationValidationError(context.dataPath, cause)
  }

  await writeDataFileAtomically(context.dataPath, serializeData(result.data))
  return result
}
