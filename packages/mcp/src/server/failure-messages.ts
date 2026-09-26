import type { FieldType } from 'gissen'
import type { AnyDocumentError } from '../document/errors'
import { GissenValidationError } from 'gissen'
import { describeValue, isDocumentError } from '../document/errors'
import { DataFileError, DataParseError, DataValidationError, DataWriteError, PostMutationValidationError } from '../errors'

/** What a message needs beyond the error itself: which file it's about, and whether to append the "nothing changed" suffix. */
export interface FailureContext {
  dataPath: string
  /** `read_page` never writes, so its failures omit the mutation suffix — it reads oddly on a read tool. */
  mutating: boolean
}

/**
 * Turns any failure a tool call can produce into the single agent-facing
 * string returned as `content[0].text` with `isError: true`. Decision 8:
 * every rejection names what was wrong and what's available, so the agent
 * can self-correct on the next call without another round trip.
 */
export function formatToolFailure(error: unknown, ctx: FailureContext): string {
  if (isDocumentError(error))
    return withMutationSuffix(formatDocumentError(error, ctx), ctx)
  if (error instanceof DataFileError)
    return withMutationSuffix(error.message, ctx)
  if (error instanceof DataParseError)
    return withMutationSuffix(error.message, ctx)
  if (error instanceof DataValidationError)
    return withMutationSuffix(formatDataValidationError(error), ctx)
  // Not the agent's fault, and retrying the identical call can't help — its
  // own wording says so instead of the generic "not changed" suffix.
  if (error instanceof PostMutationValidationError)
    return formatPostMutationValidationError(error)
  // States the write's own durability guarantee instead of the generic suffix.
  if (error instanceof DataWriteError)
    return formatDataWriteError(error)
  if (error instanceof Error)
    return withMutationSuffix(`Unexpected error: ${error.message}`, ctx)
  return withMutationSuffix(`Unexpected error: ${String(error)}`, ctx)
}

function withMutationSuffix(message: string, ctx: FailureContext): string {
  return ctx.mutating ? `${message} The page was not changed.` : message
}

/**
 * Exhaustive over `DocumentErrorCode` (`default: assertNever` makes a missed
 * case a compile error) — this is exactly why Phase B gave every
 * `DocumentError` a literal `code` discriminant instead of relying on
 * `instanceof`.
 */
export function formatDocumentError(error: AnyDocumentError, ctx: FailureContext): string {
  switch (error.code) {
    case 'unknown_component_type':
      return error.availableTypes.length > 0
        ? `Unknown component type "${error.type}". This project registers: ${quoteList(error.availableTypes)}. Use one of those exactly — names are case-sensitive.`
        : `This project registers no component types, so no component can be added. Add components to your Gissen config.`

    case 'unknown_field':
      return error.availableFields.length > 0
        ? `Component "${error.componentId}" (type "${error.componentType}") has no field "${error.field}". Its fields are: ${quoteList(error.availableFields)}.`
        : `Component "${error.componentId}" (type "${error.componentType}") declares no fields, so no props can be set.`

    case 'reserved_field':
      return `"id" is read-only and cannot be set on component "${error.componentId}". Remove "id" from props; to address a different component, pass its id as the "id" argument instead.`

    case 'invalid_select_value':
      return `Invalid value ${formatValue(error.value)} for select field "${error.field}" on component "${error.componentId}" (type "${error.componentType}"). Allowed values: ${formatOptions(error.options)}.`

    case 'number_out_of_range':
      return `Value ${error.value} for number field "${error.field}" on component "${error.componentId}" (type "${error.componentType}") is out of range. Allowed range: ${describeNumberRangeConstraint(error.min, error.max)}.`

    case 'non_finite_number':
      return `Field "${error.field}" on component "${error.componentId}" (type "${error.componentType}") must be a finite number; received ${formatValue(error.value)}. JSON has no NaN or Infinity — send a finite number.`

    case 'field_type_mismatch':
      return `Field "${error.field}" on component "${error.componentId}" (type "${error.componentType}") expects ${typeWord(error.expected)}, received ${article(error.received)} (${formatValue(error.value)}). Values are not coerced — send the right JSON type. Send null to clear the field.`

    case 'slot_field_not_editable':
      return `"${error.field}" is a slot field on component "${error.componentId}" (type "${error.componentType}") and holds child components, so it cannot be set with update_component. Use add_component, move_component or delete_component to change children. Slot fields on ${error.componentType}: ${quoteList(error.slotFields)}.`

    case 'type_not_allowed_in_slot':
      return error.allowedTypes.length > 0
        ? `Component type "${error.rejectedType}" is not allowed in slot "${error.slot}" of component "${error.parentId}" (type "${error.parentType}"). That slot accepts: ${quoteList(error.allowedTypes)}. Place it where it is accepted, or omit parentId to place it at the top level.`
        : `Component type "${error.rejectedType}" is not allowed in slot "${error.slot}" of component "${error.parentId}" (type "${error.parentType}"). That slot accepts no component types.`

    case 'node_not_found':
      return `No component with id "${error.id}" exists in this page. Call read_page for the current ids — ids change when components are deleted.`

    case 'parent_not_found':
      return `No component with id "${error.parentId}" exists in this page, so it cannot be used as parentId. Call read_page for the current ids.`

    case 'field_is_not_a_slot': {
      const detail = error.fieldType === 'undeclared'
        ? `"${error.field}" is not a declared field on component "${error.parentId}" (type "${error.parentType}").`
        : `"${error.field}" on component "${error.parentId}" (type "${error.parentType}") is a ${error.fieldType} field, not a slot, so components cannot be placed in it.`
      return error.slotFields.length > 0
        ? `${detail} Slot fields on ${error.parentType}: ${quoteList(error.slotFields)}.`
        : `${detail} ${error.parentType} has no slot fields — this type cannot contain children.`
    }

    case 'slot_required':
      return error.slotFields.length > 0
        ? `Placing a component inside "${error.parentId}" (type "${error.parentType}") requires a slot name. Slot fields on ${error.parentType}: ${quoteList(error.slotFields)}. Pass slot together with parentId, or omit parentId to place at the top level.`
        : `"${error.parentType}" has no slot fields, so nothing can be placed inside "${error.parentId}".`

    case 'root_slot_not_applicable':
      return `"slot" ("${error.slot}") was given without a parentId. The top level of the page has no slots — omit slot to place at the top level, or pass the parentId of the component that owns slot "${error.slot}".`

    case 'move_into_self':
      return `Cannot move component "${error.id}" into itself. Choose a different parentId, or omit parentId to move it to the top level.`

    case 'move_into_descendant':
      return `Cannot move component "${error.id}" into "${error.targetParentId}", because "${error.targetParentId}" is inside it (at ${error.descendantPath}). Moving a component into its own subtree would detach that subtree from the page. Move it to the top level (omit parentId), or to a parent outside its subtree.`

    case 'index_out_of_range':
      return `Index ${error.index} is out of range for ${describeIndexPlacement(error.parentId, error.slot)}. Valid indexes here are ${error.minIndex} to ${error.maxIndex} (${error.maxIndex} appends at the end); omit index to append.`

    case 'duplicate_component_ids':
      return `The data file has duplicate component ids, so an id no longer identifies one component and no operation can run safely: ${error.duplicates.map(d => `"${d.id}" appears at ${d.paths.join(' and ')}`).join('; ')}. Fix "${ctx.dataPath}" so every component's props.id is unique, then retry.`

    default:
      return assertNever(error)
  }
}

function formatDataValidationError(error: DataValidationError): string {
  const header = `The Gissen data file at "${error.dataPath}" does not match this project's config, so no operation can run:`
  const lines = renderValidationIssueLines(error.cause)
  return `${[header, ...lines].join('\n')}\nFix the data file, or the config it is validated against, and retry.`
}

function formatPostMutationValidationError(error: PostMutationValidationError): string {
  const header = `Internal error: applying this operation would have produced a page that fails Gissen validation, so nothing was written to "${error.dataPath}". This is a bug in gissen-mcp, not a problem with your request — please report it. Details:`
  return [header, ...renderValidationIssueLines(error.cause)].join('\n')
}

function formatDataWriteError(error: DataWriteError): string {
  return `${error.message} The file is unchanged — the new content is written to a temporary file and only renamed into place once the write succeeds.`
}

function renderValidationIssueLines(cause: unknown): string[] {
  if (cause instanceof GissenValidationError) {
    return cause.issues.map(issue => `  ${formatIssuePath(issue.path)}: ${issue.message}`)
  }
  return [`  ${cause instanceof Error ? cause.message : String(cause)}`]
}

/** Mirrors the (unexported) path formatting `GissenValidationError` uses internally, so these lines read the same way. */
function formatIssuePath(path: (string | number)[]): string {
  return path.reduce<string>((acc, segment, index) => {
    if (typeof segment === 'number')
      return `${acc}[${segment}]`
    return index === 0 ? String(segment) : `${acc}.${segment}`
  }, '')
}

function quoteList(items: readonly string[]): string {
  return items.length > 0 ? items.map(item => `"${item}"`).join(', ') : '(none)'
}

function formatValue(value: unknown): string {
  if (value === undefined)
    return 'undefined'
  // JSON.stringify(NaN) and JSON.stringify(Infinity) are both the string
  // "null" — exactly the confusing report `non_finite_number` exists to
  // prevent, so these are named directly rather than run through JSON.
  if (typeof value === 'number' && !Number.isFinite(value))
    return String(value)
  try {
    return JSON.stringify(value)
  }
  catch {
    return describeValue(value)
  }
}

function typeWord(type: FieldType): string {
  switch (type) {
    case 'text':
    case 'textarea':
      return 'a string'
    case 'number':
      return 'a number'
    case 'boolean':
      return 'a boolean (true or false)'
    case 'select':
      return 'a select option value'
    case 'slot':
      return 'an array of components'
    default:
      return assertNever(type)
  }
}

function article(kind: string): string {
  switch (kind) {
    case 'array':
      return 'an array'
    case 'object':
      return 'an object'
    case 'undefined':
      return 'undefined'
    case 'null':
      return 'null'
    default:
      return `a ${kind}`
  }
}

function formatOptions(options: readonly { label: string, value: string | number }[]): string {
  return options
    .map(option => (option.label === String(option.value) ? JSON.stringify(option.value) : `${JSON.stringify(option.value)} (${option.label})`))
    .join(', ')
}

function describeNumberRangeConstraint(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined)
    return `${min} to ${max}`
  if (min !== undefined)
    return `${min} or greater`
  if (max !== undefined)
    return `${max} or less`
  // Defensive: NumberOutOfRangeError is only ever constructed when at least
  // one bound was violated, so this branch should be unreachable in practice.
  return 'any finite number'
}

function describeIndexPlacement(parentId: string | null, slot: string | null): string {
  return parentId !== null && slot !== null
    ? `slot "${slot}" of component "${parentId}"`
    : 'the top level of the page'
}

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`)
}
