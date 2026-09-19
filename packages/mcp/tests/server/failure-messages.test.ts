import type { FailureContext } from '../../src/server/failure-messages'
import { GissenValidationError, validateData } from 'gissen'
import { describe, expect, it } from 'vitest'
import {
  DuplicateComponentIdsError,
  FieldIsNotASlotError,
  FieldTypeMismatchError,
  IndexOutOfRangeError,
  InvalidDefaultPropError,
  InvalidSelectValueError,
  MoveIntoDescendantError,
  MoveIntoSelfError,
  NodeNotFoundError,
  NonFiniteNumberError,
  NumberOutOfRangeError,
  ParentNotFoundError,
  ReservedFieldError,
  RootSlotNotApplicableError,
  SlotFieldNotEditableError,
  SlotRequiredError,
  TypeNotAllowedInSlotError,
  UnknownComponentTypeError,
  UnknownFieldError,
} from '../../src/document/errors'
import { DataFileError, DataParseError, DataValidationError, DataWriteError, PostMutationValidationError } from '../../src/errors'
import { formatDocumentError, formatToolFailure } from '../../src/server/failure-messages'
import { testConfig } from '../document/helpers'

const mutating: FailureContext = { dataPath: '/tmp/page.json', mutating: true }
const reading: FailureContext = { dataPath: '/tmp/page.json', mutating: false }

function makeValidationError(): GissenValidationError {
  try {
    validateData(
      { version: 1, root: { props: {} }, content: [{ type: 'Hero', props: { id: 'h1', level: 99 } }] },
      testConfig,
    )
  }
  catch (error) {
    if (error instanceof GissenValidationError)
      return error
    throw error
  }
  throw new Error('expected validateData to throw')
}

describe('formatDocumentError', () => {
  it('unknown_component_type — lists the registered types', () => {
    const error = new UnknownComponentTypeError('Widget', ['Hero', 'Container', 'Freeform'])
    expect(formatDocumentError(error, reading)).toBe(
      'Unknown component type "Widget". This project registers: "Hero", "Container", "Freeform". Use one of those exactly — names are case-sensitive.',
    )
  })

  it('unknown_component_type — empty registry', () => {
    const error = new UnknownComponentTypeError('Widget', [])
    expect(formatDocumentError(error, reading)).toBe(
      'This project registers no component types, so no component can be added. Add components to your Gissen config.',
    )
  })

  it('unknown_field — lists the component\'s fields', () => {
    const error = new UnknownFieldError('hero_a1', 'Hero', 'headline', ['title', 'level'])
    expect(formatDocumentError(error, reading)).toBe(
      'Component "hero_a1" (type "Hero") has no field "headline". Its fields are: "title", "level".',
    )
  })

  it('unknown_field — no declared fields', () => {
    const error = new UnknownFieldError('hero_a1', 'Hero', 'headline', [])
    expect(formatDocumentError(error, reading)).toBe(
      'Component "hero_a1" (type "Hero") declares no fields, so no props can be set.',
    )
  })

  it('reserved_field', () => {
    const error = new ReservedFieldError('hero_a1')
    expect(formatDocumentError(error, reading)).toBe(
      '"id" is read-only and cannot be set on component "hero_a1". Remove "id" from props; to address a different component, pass its id as the "id" argument instead.',
    )
  })

  it('invalid_select_value — label differs from value', () => {
    const error = new InvalidSelectValueError(
      'hero_a1',
      'Hero',
      'theme',
      'dark',
      [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }],
      ['primary', 'secondary'],
    )
    expect(formatDocumentError(error, reading)).toBe(
      'Invalid value "dark" for select field "theme" on component "hero_a1" (type "Hero"). Allowed values: "primary" (Primary), "secondary" (Secondary).',
    )
  })

  it('invalid_select_value — label equal to stringified value renders bare', () => {
    const error = new InvalidSelectValueError(
      'banner_b1',
      'Banner',
      'rank',
      3,
      [{ label: '1', value: 1 }, { label: '2', value: 2 }],
      [1, 2],
    )
    expect(formatDocumentError(error, reading)).toBe(
      'Invalid value 3 for select field "rank" on component "banner_b1" (type "Banner"). Allowed values: 1, 2.',
    )
  })

  it('number_out_of_range — both bounds', () => {
    const error = new NumberOutOfRangeError('hero_a1', 'Hero', 'level', 99, 1, 6)
    expect(formatDocumentError(error, reading)).toBe(
      'Value 99 for number field "level" on component "hero_a1" (type "Hero") is out of range. Allowed range: 1 to 6.',
    )
  })

  it('number_out_of_range — min only', () => {
    const error = new NumberOutOfRangeError('b1', 'Box', 'size', -5, 0, undefined)
    expect(formatDocumentError(error, reading)).toBe(
      'Value -5 for number field "size" on component "b1" (type "Box") is out of range. Allowed range: 0 or greater.',
    )
  })

  it('number_out_of_range — max only', () => {
    const error = new NumberOutOfRangeError('b1', 'Box', 'size', 999, undefined, 100)
    expect(formatDocumentError(error, reading)).toBe(
      'Value 999 for number field "size" on component "b1" (type "Box") is out of range. Allowed range: 100 or less.',
    )
  })

  it('non_finite_number — NaN is named directly, not rendered as null', () => {
    const error = new NonFiniteNumberError('hero_a1', 'Hero', 'level', Number.NaN)
    expect(formatDocumentError(error, reading)).toBe(
      'Field "level" on component "hero_a1" (type "Hero") must be a finite number; received NaN. JSON has no NaN or Infinity — send a finite number.',
    )
  })

  it('non_finite_number — Infinity', () => {
    const error = new NonFiniteNumberError('hero_a1', 'Hero', 'level', Number.POSITIVE_INFINITY)
    expect(formatDocumentError(error, reading)).toBe(
      'Field "level" on component "hero_a1" (type "Hero") must be a finite number; received Infinity. JSON has no NaN or Infinity — send a finite number.',
    )
  })

  it('field_type_mismatch — number expected, string received', () => {
    const error = new FieldTypeMismatchError('hero_a1', 'Hero', 'level', 'number', 'string', '5')
    expect(formatDocumentError(error, reading)).toBe(
      'Field "level" on component "hero_a1" (type "Hero") expects a number, received a string ("5"). Values are not coerced — send the right JSON type. Send null to clear the field.',
    )
  })

  it('field_type_mismatch — boolean expected, number received', () => {
    const error = new FieldTypeMismatchError('b1', 'Banner', 'featured', 'boolean', 'number', 1)
    expect(formatDocumentError(error, reading)).toBe(
      'Field "featured" on component "b1" (type "Banner") expects a boolean (true or false), received a number (1). Values are not coerced — send the right JSON type. Send null to clear the field.',
    )
  })

  it('slot_field_not_editable', () => {
    const error = new SlotFieldNotEditableError('c1', 'Container', 'children', ['children'])
    expect(formatDocumentError(error, reading)).toBe(
      '"children" is a slot field on component "c1" (type "Container") and holds child components, so it cannot be set with update_component. Use add_component, move_component or delete_component to change children. Slot fields on Container: "children".',
    )
  })

  it('invalid_default_prop', () => {
    const error = new InvalidDefaultPropError('Hero', 'level', 99, 'Prop "level" must be <= 6 (got 99)')
    expect(formatDocumentError(error, reading)).toBe(
      'Cannot create a "Hero": this project\'s config declares an invalid default for field "level" (99) — Prop "level" must be <= 6 (got 99). This is a problem in the Gissen config, not in your request; fix defaultProps for Hero.',
    )
  })

  it('type_not_allowed_in_slot — lists what the slot accepts', () => {
    const error = new TypeNotAllowedInSlotError('container_b2', 'Container', 'children', 'Freeform', ['Hero'])
    expect(formatDocumentError(error, reading)).toBe(
      'Component type "Freeform" is not allowed in slot "children" of component "container_b2" (type "Container"). That slot accepts: "Hero". Place it where it is accepted, or omit parentId to place it at the top level.',
    )
  })

  it('type_not_allowed_in_slot — slot accepts nothing', () => {
    const error = new TypeNotAllowedInSlotError('c1', 'Container', 'children', 'Hero', [])
    expect(formatDocumentError(error, reading)).toBe(
      'Component type "Hero" is not allowed in slot "children" of component "c1" (type "Container"). That slot accepts no component types.',
    )
  })

  it('node_not_found', () => {
    const error = new NodeNotFoundError('nope')
    expect(formatDocumentError(error, reading)).toBe(
      'No component with id "nope" exists in this page. Call read_page for the current ids — ids change when components are deleted.',
    )
  })

  it('parent_not_found', () => {
    const error = new ParentNotFoundError('nope')
    expect(formatDocumentError(error, reading)).toBe(
      'No component with id "nope" exists in this page, so it cannot be used as parentId. Call read_page for the current ids.',
    )
  })

  it('field_is_not_a_slot — declared non-slot field', () => {
    const error = new FieldIsNotASlotError('h1', 'Hero', 'title', 'text', ['children'])
    expect(formatDocumentError(error, reading)).toBe(
      '"title" on component "h1" (type "Hero") is a text field, not a slot, so components cannot be placed in it. Slot fields on Hero: "children".',
    )
  })

  it('field_is_not_a_slot — undeclared field', () => {
    const error = new FieldIsNotASlotError('c1', 'Container', 'nope', 'undeclared', ['children'])
    expect(formatDocumentError(error, reading)).toBe(
      '"nope" is not a declared field on component "c1" (type "Container"). Slot fields on Container: "children".',
    )
  })

  it('field_is_not_a_slot — no slot fields at all', () => {
    const error = new FieldIsNotASlotError('h1', 'Hero', 'title', 'text', [])
    expect(formatDocumentError(error, reading)).toBe(
      '"title" on component "h1" (type "Hero") is a text field, not a slot, so components cannot be placed in it. Hero has no slot fields — this type cannot contain children.',
    )
  })

  it('slot_required — lists the parent\'s slot fields', () => {
    const error = new SlotRequiredError('c1', 'Container', ['children'])
    expect(formatDocumentError(error, reading)).toBe(
      'Placing a component inside "c1" (type "Container") requires a slot name. Slot fields on Container: "children". Pass slot together with parentId, or omit parentId to place at the top level.',
    )
  })

  it('slot_required — no slot fields', () => {
    const error = new SlotRequiredError('h1', 'Hero', [])
    expect(formatDocumentError(error, reading)).toBe(
      '"Hero" has no slot fields, so nothing can be placed inside "h1".',
    )
  })

  it('root_slot_not_applicable', () => {
    const error = new RootSlotNotApplicableError('children')
    expect(formatDocumentError(error, reading)).toBe(
      '"slot" ("children") was given without a parentId. The top level of the page has no slots — omit slot to place at the top level, or pass the parentId of the component that owns slot "children".',
    )
  })

  it('move_into_self', () => {
    const error = new MoveIntoSelfError('c1')
    expect(formatDocumentError(error, reading)).toBe(
      'Cannot move component "c1" into itself. Choose a different parentId, or omit parentId to move it to the top level.',
    )
  })

  it('move_into_descendant', () => {
    const error = new MoveIntoDescendantError('c1', 'c2', 'content[0].props.children[0]')
    expect(formatDocumentError(error, reading)).toBe(
      'Cannot move component "c1" into "c2", because "c2" is inside it (at content[0].props.children[0]). Moving a component into its own subtree would detach that subtree from the page. Move it to the top level (omit parentId), or to a parent outside its subtree.',
    )
  })

  it('index_out_of_range — inside a slot', () => {
    const error = new IndexOutOfRangeError(7, 2, 'c1', 'children')
    expect(formatDocumentError(error, reading)).toBe(
      'Index 7 is out of range for slot "children" of component "c1". Valid indexes here are 0 to 2 (2 appends at the end); omit index to append.',
    )
  })

  it('index_out_of_range — top level', () => {
    const error = new IndexOutOfRangeError(5, 1, null, null)
    expect(formatDocumentError(error, reading)).toBe(
      'Index 5 is out of range for the top level of the page. Valid indexes here are 0 to 1 (1 appends at the end); omit index to append.',
    )
  })

  it('duplicate_component_ids — names the file and every path', () => {
    const error = new DuplicateComponentIdsError([{ id: 'dup', paths: ['content[0]', 'content[1].props.children[0]'] }])
    expect(formatDocumentError(error, { dataPath: '/tmp/page.json', mutating: false })).toBe(
      'The data file has duplicate component ids, so an id no longer identifies one component and no operation can run safely: "dup" appears at content[0] and content[1].props.children[0]. Fix "/tmp/page.json" so every component\'s props.id is unique, then retry.',
    )
  })
})

describe('formatToolFailure', () => {
  it('appends the mutation suffix to a DocumentError when mutating', () => {
    const message = formatToolFailure(new NodeNotFoundError('nope'), mutating)
    expect(message.endsWith(' The page was not changed.')).toBe(true)
  })

  it('omits the mutation suffix for a read_page (non-mutating) failure', () => {
    const message = formatToolFailure(new NodeNotFoundError('nope'), reading)
    expect(message.endsWith(' The page was not changed.')).toBe(false)
  })

  it('dataFileError gets the mutation suffix', () => {
    const error = new DataFileError('/tmp/page.json', new Error('ENOENT'))
    const message = formatToolFailure(error, mutating)
    expect(message).toContain('Cannot read Gissen data file')
    expect(message.endsWith(' The page was not changed.')).toBe(true)
  })

  it('dataParseError gets the mutation suffix', () => {
    const error = new DataParseError('/tmp/page.json', new Error('Unexpected token'))
    const message = formatToolFailure(error, mutating)
    expect(message).toContain('is not valid JSON')
    expect(message.endsWith(' The page was not changed.')).toBe(true)
  })

  it('dataValidationError renders one issue per line and gets the mutation suffix', () => {
    const error = new DataValidationError('/tmp/page.json', makeValidationError())
    const message = formatToolFailure(error, mutating)
    expect(message).toContain('The Gissen data file at "/tmp/page.json" does not match this project\'s config, so no operation can run:')
    expect(message).toContain('level')
    expect(message).toContain('Fix the data file, or the config it is validated against, and retry.')
    expect(message.endsWith(' The page was not changed.')).toBe(true)
  })

  it('postMutationValidationError is worded as our bug and has no generic suffix', () => {
    const error = new PostMutationValidationError('/tmp/page.json', makeValidationError())
    const message = formatToolFailure(error, mutating)
    expect(message).toContain('Internal error:')
    expect(message).toContain('nothing was written to "/tmp/page.json"')
    expect(message).toContain('please report it')
    expect(message.endsWith(' The page was not changed.')).toBe(false)
  })

  it('dataWriteError states its own durability guarantee, no generic suffix', () => {
    const error = new DataWriteError('/tmp/page.json', new Error('EACCES'))
    const message = formatToolFailure(error, mutating)
    expect(message).toContain('Could not write Gissen data file')
    expect(message).toContain('written to a temporary file and only renamed into place')
    expect(message.endsWith(' The page was not changed.')).toBe(false)
  })

  it('formats an unexpected Error', () => {
    expect(formatToolFailure(new Error('boom'), mutating)).toBe('Unexpected error: boom The page was not changed.')
  })

  it('formats a non-Error thrown value', () => {
    expect(formatToolFailure('nope', reading)).toBe('Unexpected error: nope')
  })
})
