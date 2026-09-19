import type { ComponentData } from 'gissen'
import type {
  AddComponentResult,
  DeleteComponentResult,
  MoveComponentResult,
  ReadPageResult,
  ResolvedPlacement,
  UpdateComponentResult,
} from '../document/types'
import type { Grammar } from '../grammar/types'
import { indexGrammar } from '../document/grammar-index'
import { findNode, walkNodes } from '../document/tree'
import { describeComponentTypes, describeRootFields } from './grammar-prose'

/** `"container_b2" slot "children" (index 1)` / `the top level of the page (index 2)`. */
export function describePlacement(placement: ResolvedPlacement): string {
  return placement.parentId !== null && placement.slot !== null
    ? `"${placement.parentId}" slot "${placement.slot}" (index ${placement.index})`
    : `the top level of the page (index ${placement.index})`
}

/**
 * `read_page` echoes the grammar on every call (not just description text)
 * so an agent that calls only this tool still knows what it may do — the
 * grammar is a few dozen lines bounded by the config, unlike the tree.
 */
export function formatReadPageSuccess(result: ReadPageResult, dataPath: string): string {
  const index = indexGrammar(result.grammar)
  let total = 0
  walkNodes(result.page, index, () => {
    total++
  })
  const topLevel = result.page.content.length

  const tree = JSON.stringify(result.page, null, 2)
  const rootFields = describeRootFields(result.grammar)
  const rootLine = rootFields ? `\nPage root props (read-only here): ${rootFields}` : ''

  return [
    `Gissen page at ${dataPath} — ${total} component${total === 1 ? '' : 's'} (${topLevel} at the top level).`,
    '',
    tree,
    '',
    `Component types in this project:`,
    describeComponentTypes(result.grammar),
  ].join('\n') + rootLine
}

export function formatAddComponentSuccess(result: AddComponentResult, grammar: Grammar, dataPath: string): string {
  const index = indexGrammar(grammar)
  const location = findNode(result.data, index, result.id)
  const type = location?.node.type ?? result.id

  const placementText = result.placement.parentId !== null && result.placement.slot !== null
    ? `inside "${result.placement.parentId}" slot "${result.placement.slot}" at index ${result.placement.index}`
    : `at the top level of the page at index ${result.placement.index}`

  const setFields = location ? formatSetFieldsSummary(location.node, grammar) : undefined
  const defaultsLine = setFields
    ? `Defaults applied: ${setFields}.\nUse update_component with id "${result.id}" to change them.`
    : `The configured defaults set no fields.`

  return `Added a "${type}" with id "${result.id}" ${placementText}.\n${defaultsLine}\nWrote ${dataPath}.`
}

function formatSetFieldsSummary(node: ComponentData, grammar: Grammar): string | undefined {
  const index = indexGrammar(grammar)
  const parts = index.fieldNames(node.type)
    .filter(name => index.field(node.type, name)?.type !== 'slot')
    .filter(name => node.props[name] !== undefined)
    .map(name => `${name}=${JSON.stringify(node.props[name])}`)
  return parts.length > 0 ? parts.join(', ') : undefined
}

export function formatUpdateComponentSuccess(
  id: string,
  result: UpdateComponentResult,
  grammar: Grammar,
  dataPath: string,
): string {
  const index = indexGrammar(grammar)
  const location = findNode(result.data, index, id)
  const type = location?.node.type ?? id

  const entries = Object.entries(result.applied).map(formatAppliedEntry)
  const appliedText = entries.length > 0 ? entries.join(', ') : '(nothing — an empty props object was given)'

  return `Updated component "${id}" (type "${type}").\nApplied: ${appliedText}.\nWrote ${dataPath}.`
}

/**
 * A cleared field's resolved value is `undefined` for every type except
 * text/textarea (which clear to `''`) — `JSON.stringify` drops an
 * `undefined` key entirely, so a plain `key=undefined` would read as
 * broken. An empty string needs no special-casing: `key=""` already reads
 * as "cleared" on its own.
 */
function formatAppliedEntry([key, value]: [string, unknown]): string {
  return value === undefined ? `${key} cleared (absent from the saved file)` : `${key}=${JSON.stringify(value)}`
}

export function formatDeleteComponentSuccess(result: DeleteComponentResult, dataPath: string): string {
  if (result.removedDescendantIds.length === 0) {
    return `Deleted component "${result.removedId}" (type "${result.removedType}"). It had no children.\nWrote ${dataPath}.`
  }
  const allIds = [result.removedId, ...result.removedDescendantIds]
  const count = result.removedDescendantIds.length
  return `Deleted component "${result.removedId}" (type "${result.removedType}") and ${count} component${count === 1 ? '' : 's'} nested inside it.\n`
    + `These ids no longer exist: ${allIds.map(nid => `"${nid}"`).join(', ')}.\nWrote ${dataPath}.`
}

export function formatMoveComponentSuccess(id: string, result: MoveComponentResult, dataPath: string): string {
  const fromText = describePlacement(result.from)
  const toText = describePlacement(result.to)
  // "Nothing changed" is only knowable by comparing serializations, and a
  // no-op move can still legitimately rewrite the file (materializing a
  // previously-absent `[]` slot) — say so rather than implying no write happened.
  const noopNote = placementsEqual(result.from, result.to)
    ? ' The component was already in that position; the file was rewritten but the layout is unchanged.'
    : ''
  return `Moved component "${id}" from ${fromText} to ${toText}.${noopNote}\nWrote ${dataPath}.`
}

function placementsEqual(a: ResolvedPlacement, b: ResolvedPlacement): boolean {
  return a.parentId === b.parentId && a.slot === b.slot && a.index === b.index
}
