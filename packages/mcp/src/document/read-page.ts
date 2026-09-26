import type { GissenData } from 'gissen'
import type { DocumentContext, ReadPageResult } from './types'
import { indexGrammar } from './grammar-index'
import { normalizeDocumentSlots } from './normalize-document'

/**
 * Returns the page tree alongside the grammar, so an agent that calls only
 * this tool still knows what it may do. Clones, then normalizes absent
 * declared slots to `[]` (see `normalizeDocumentSlots`).
 *
 * Does not check for duplicate ids: per decision, that check runs once, in
 * the caller's shared read path, before any operation (including this one)
 * is dispatched — not re-walked inside each operation. See `assertUniqueIds`
 * in `./tree`.
 */
export function readPage(data: GissenData, ctx: DocumentContext): ReadPageResult {
  const index = indexGrammar(ctx.grammar)
  const page = structuredClone(data)
  normalizeDocumentSlots(page, index)
  return { page, grammar: ctx.grammar }
}
