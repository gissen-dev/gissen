import type { FieldType } from 'gissen'

/**
 * Discriminant for every rejection a document operation can throw. Lets a
 * caller (Phase C) write an exhaustive `switch` over `AnyDocumentError['code']`
 * with `default: assertNever(error)` — something an `instanceof` chain can't
 * be checked for at compile time.
 */
export type DocumentErrorCode =
  | 'unknown_component_type'
  | 'unknown_field'
  | 'reserved_field'
  | 'invalid_select_value'
  | 'number_out_of_range'
  | 'non_finite_number'
  | 'field_type_mismatch'
  | 'slot_field_not_editable'
  | 'invalid_default_prop'
  | 'type_not_allowed_in_slot'
  | 'node_not_found'
  | 'parent_not_found'
  | 'field_is_not_a_slot'
  | 'slot_required'
  | 'root_slot_not_applicable'
  | 'move_into_self'
  | 'move_into_descendant'
  | 'index_out_of_range'
  | 'duplicate_component_ids'

/**
 * Base class for every rejection a document operation throws. The `message`
 * on each subclass is a terse factual summary (for a raw log line); the
 * agent-facing instructive wording (decision 8) is built by Phase C from the
 * subclass's own readonly fields, not from `message`.
 */
export abstract class DocumentError extends Error {
  abstract readonly code: DocumentErrorCode
}

export class UnknownComponentTypeError extends DocumentError {
  readonly code = 'unknown_component_type' as const
  constructor(readonly type: string, readonly availableTypes: readonly string[]) {
    super(`Unknown component type "${type}"`)
    this.name = 'UnknownComponentTypeError'
  }
}

export class UnknownFieldError extends DocumentError {
  readonly code = 'unknown_field' as const
  constructor(
    readonly componentId: string,
    readonly componentType: string,
    readonly field: string,
    readonly availableFields: readonly string[],
  ) {
    super(`Unknown field "${field}" on component "${componentId}" (type "${componentType}")`)
    this.name = 'UnknownFieldError'
  }
}

export class ReservedFieldError extends DocumentError {
  readonly code = 'reserved_field' as const
  readonly field = 'id' as const
  constructor(readonly componentId: string) {
    super(`"id" is a reserved field and cannot be edited (component "${componentId}")`)
    this.name = 'ReservedFieldError'
  }
}

export class InvalidSelectValueError extends DocumentError {
  readonly code = 'invalid_select_value' as const
  constructor(
    readonly componentId: string,
    readonly componentType: string,
    readonly field: string,
    readonly value: unknown,
    readonly options: readonly { label: string, value: string | number }[],
    readonly allowedValues: readonly (string | number)[],
  ) {
    super(`Invalid value for select field "${field}" on component "${componentId}"`)
    this.name = 'InvalidSelectValueError'
  }
}

export class NumberOutOfRangeError extends DocumentError {
  readonly code = 'number_out_of_range' as const
  constructor(
    readonly componentId: string,
    readonly componentType: string,
    readonly field: string,
    readonly value: number,
    readonly min: number | undefined,
    readonly max: number | undefined,
  ) {
    super(`Value ${value} for field "${field}" on component "${componentId}" is out of range`)
    this.name = 'NumberOutOfRangeError'
  }
}

export class NonFiniteNumberError extends DocumentError {
  readonly code = 'non_finite_number' as const
  constructor(
    readonly componentId: string,
    readonly componentType: string,
    readonly field: string,
    readonly value: unknown,
  ) {
    super(`Field "${field}" on component "${componentId}" must be a finite number`)
    this.name = 'NonFiniteNumberError'
  }
}

export class FieldTypeMismatchError extends DocumentError {
  readonly code = 'field_type_mismatch' as const
  constructor(
    readonly componentId: string,
    readonly componentType: string,
    readonly field: string,
    readonly expected: FieldType,
    readonly received: string,
    readonly value: unknown,
  ) {
    super(`Field "${field}" on component "${componentId}" expects ${expected}, received ${received}`)
    this.name = 'FieldTypeMismatchError'
  }
}

export class SlotFieldNotEditableError extends DocumentError {
  readonly code = 'slot_field_not_editable' as const
  constructor(
    readonly componentId: string,
    readonly componentType: string,
    readonly field: string,
    readonly slotFields: readonly string[],
  ) {
    super(`"${field}" is a slot field on component "${componentId}" and cannot be edited via update_component`)
    this.name = 'SlotFieldNotEditableError'
  }
}

/**
 * Thrown by `createNode` when a config's own `defaultProps` violates that
 * same field's constraints (e.g. `defaultProps: { level: 99 }` against
 * `max: 6`) — `validateConfig` does not range-check `defaultProps`, so this
 * can only be caught here, at the point a node is actually instantiated.
 */
export class InvalidDefaultPropError extends DocumentError {
  readonly code = 'invalid_default_prop' as const
  constructor(
    readonly componentType: string,
    readonly field: string,
    readonly value: unknown,
    readonly reason: string,
  ) {
    super(`Config default for "${field}" on component type "${componentType}" is invalid: ${reason}`)
    this.name = 'InvalidDefaultPropError'
  }
}

export class TypeNotAllowedInSlotError extends DocumentError {
  readonly code = 'type_not_allowed_in_slot' as const
  constructor(
    readonly parentId: string,
    readonly parentType: string,
    readonly slot: string,
    readonly rejectedType: string,
    readonly allowedTypes: readonly string[],
  ) {
    super(`Component type "${rejectedType}" is not allowed in slot "${slot}" of "${parentId}" (type "${parentType}")`)
    this.name = 'TypeNotAllowedInSlotError'
  }
}

export class NodeNotFoundError extends DocumentError {
  readonly code = 'node_not_found' as const
  constructor(readonly id: string) {
    super(`No component found with id "${id}"`)
    this.name = 'NodeNotFoundError'
  }
}

export class ParentNotFoundError extends DocumentError {
  readonly code = 'parent_not_found' as const
  constructor(readonly parentId: string) {
    super(`No component found with id "${parentId}"`)
    this.name = 'ParentNotFoundError'
  }
}

export class FieldIsNotASlotError extends DocumentError {
  readonly code = 'field_is_not_a_slot' as const
  constructor(
    readonly parentId: string,
    readonly parentType: string,
    readonly field: string,
    readonly fieldType: FieldType | 'undeclared',
    readonly slotFields: readonly string[],
  ) {
    super(`"${field}" is not a slot field on component "${parentId}" (type "${parentType}")`)
    this.name = 'FieldIsNotASlotError'
  }
}

export class SlotRequiredError extends DocumentError {
  readonly code = 'slot_required' as const
  constructor(
    readonly parentId: string,
    readonly parentType: string,
    readonly slotFields: readonly string[],
  ) {
    super(`A slot is required when placing a component inside "${parentId}" (type "${parentType}")`)
    this.name = 'SlotRequiredError'
  }
}

/** Thrown when `slot` is given without a `parentId` — root content has no slot concept. */
export class RootSlotNotApplicableError extends DocumentError {
  readonly code = 'root_slot_not_applicable' as const
  constructor(readonly slot: string) {
    super(`"slot" ("${slot}") does not apply at the top level — omit it to place at the top level`)
    this.name = 'RootSlotNotApplicableError'
  }
}

export class MoveIntoSelfError extends DocumentError {
  readonly code = 'move_into_self' as const
  constructor(readonly id: string) {
    super(`Cannot move component "${id}" into itself`)
    this.name = 'MoveIntoSelfError'
  }
}

export class MoveIntoDescendantError extends DocumentError {
  readonly code = 'move_into_descendant' as const
  constructor(
    readonly id: string,
    readonly targetParentId: string,
    readonly descendantPath: string,
  ) {
    super(`Cannot move component "${id}" into its own descendant "${targetParentId}" (${descendantPath})`)
    this.name = 'MoveIntoDescendantError'
  }
}

export class IndexOutOfRangeError extends DocumentError {
  readonly code = 'index_out_of_range' as const
  readonly minIndex = 0 as const
  constructor(
    readonly index: number,
    readonly maxIndex: number,
    readonly parentId: string | null,
    readonly slot: string | null,
  ) {
    super(`Index ${index} is out of range (0..${maxIndex})`)
    this.name = 'IndexOutOfRangeError'
  }
}

export class DuplicateComponentIdsError extends DocumentError {
  readonly code = 'duplicate_component_ids' as const
  constructor(readonly duplicates: readonly { id: string, paths: readonly string[] }[]) {
    super(`Duplicate component id(s): ${duplicates.map(d => d.id).join(', ')}`)
    this.name = 'DuplicateComponentIdsError'
  }
}

/** Every concrete error type a document operation can throw. */
export type AnyDocumentError =
  | UnknownComponentTypeError
  | UnknownFieldError
  | ReservedFieldError
  | InvalidSelectValueError
  | NumberOutOfRangeError
  | NonFiniteNumberError
  | FieldTypeMismatchError
  | SlotFieldNotEditableError
  | InvalidDefaultPropError
  | TypeNotAllowedInSlotError
  | NodeNotFoundError
  | ParentNotFoundError
  | FieldIsNotASlotError
  | SlotRequiredError
  | RootSlotNotApplicableError
  | MoveIntoSelfError
  | MoveIntoDescendantError
  | IndexOutOfRangeError
  | DuplicateComponentIdsError

/**
 * Narrows to `AnyDocumentError` rather than the abstract `DocumentError` —
 * `instanceof DocumentError` alone would widen `code` back to the full union
 * and lose the per-case fields a caller reads off the narrowed type.
 */
export function isDocumentError(error: unknown): error is AnyDocumentError {
  return error instanceof DocumentError
}

/**
 * A short type label for an arbitrary value, for error payloads that need to
 * say what was received (`FieldTypeMismatchError.received`, coercion
 * rejection messages). `null` and array are called out separately from
 * `object` since "expected string, received object" is unhelpfully vague for
 * either.
 */
export function describeValue(value: unknown): string {
  if (value === null)
    return 'null'
  if (Array.isArray(value))
    return 'array'
  return typeof value
}
