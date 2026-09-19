import type { DocumentContext } from '../document/types'

/**
 * Everything a tool handler needs, fixed for the life of the process. Holds
 * no page tree — per decision 7, every operation re-reads `dataPath` from
 * disk, so there is nothing here to go stale.
 */
export interface ServerContext {
  readonly dataPath: string
  readonly document: DocumentContext
}
