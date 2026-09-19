import type { Grammar } from '../grammar/types'
import { z } from 'zod'

/**
 * `z.enum` needs a non-empty tuple; a config CAN register zero component
 * types (`validateConfig` allows `components: {}`). Falls back to a bare
 * `z.string()` in that case rather than `z.enum([])` — zod 3 accepts that
 * and renders `"enum": []`, a field no value could ever satisfy, which
 * produces an opaque SDK-level input-validation rejection instead of
 * `UnknownComponentTypeError`'s instructive empty-list message reaching the
 * agent. Destructuring narrows the tuple without a cast or assertion.
 */
export function componentTypeSchema(types: readonly string[]): z.ZodString | z.ZodEnum<[string, ...string[]]> {
  const [first, ...rest] = types
  if (first === undefined)
    return z.string()
  return z.enum([first, ...rest])
}

/**
 * `parentId`/`slot` are `.nullable().optional()`, not just optional: every
 * mutating tool's success response can report `parentId: null` for "top
 * level" (see `success-messages.ts`), and an agent replaying a reported
 * placement back as input must be able to send that `null`. `.min(1)` is
 * deliberately not chained on these two — `.min(1).nullable()` renders as an
 * `anyOf` wrapper instead of the clean `"type": ["string","null"]`, and an
 * empty string already produces a fully instructive `ParentNotFoundError`.
 */
export function buildAddComponentShape(grammar: Grammar): {
  type: z.ZodString | z.ZodEnum<[string, ...string[]]>
  parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>
  slot: z.ZodOptional<z.ZodNullable<z.ZodString>>
  index: z.ZodOptional<z.ZodNumber>
} {
  return {
    type: componentTypeSchema(grammar.components.map(component => component.type))
      .describe('Component type to add. Must be one of the types listed in this tool\'s description; names are case-sensitive.'),
    parentId: z.string().nullable().optional().describe('Id of the component to add this one inside. Omit or pass null to add at the top level of the page.'),
    slot: z.string().nullable().optional().describe('Name of the slot field on parentId to add into. Required whenever parentId is given, and not accepted without one.'),
    index: z.number().int().min(0).optional().describe('Zero-based position among the destination\'s existing children. Omit to append at the end.'),
  }
}

/**
 * `props` is an open map (`additionalProperties: {}` in the rendered JSON
 * Schema): the legal keys and value types depend on the target node's
 * component type, which is only knowable after `id` is resolved against the
 * live tree — a static schema can't express that, and decision 6 forbids
 * reimplementing the validation that already lives in `resolveFieldValue`.
 * No `type` guard — see the tool description for how the type enum still
 * reaches the agent for this tool.
 */
export function buildUpdateComponentShape(): {
  id: z.ZodString
  props: z.ZodRecord<z.ZodString, z.ZodUnknown>
} {
  return {
    id: z.string().min(1).describe('Id of the component to update, as returned by read_page or add_component.'),
    props: z.record(z.unknown())
      .describe('Field values to set, keyed by field name. Only fields declared for this component\'s type are accepted. Use null to clear a field. "id" cannot be set.'),
  }
}

export function buildDeleteComponentShape(): { id: z.ZodString } {
  return {
    id: z.string().min(1).describe('Id of the component to delete. Its entire subtree is deleted with it.'),
  }
}

export function buildMoveComponentShape(): {
  id: z.ZodString
  parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>
  slot: z.ZodOptional<z.ZodNullable<z.ZodString>>
  index: z.ZodOptional<z.ZodNumber>
} {
  return {
    id: z.string().min(1).describe('Id of the component to move.'),
    parentId: z.string().nullable().optional().describe('Id of the component to move this one inside. Omit or pass null to move it to the top level of the page.'),
    slot: z.string().nullable().optional().describe('Name of the slot field on parentId to move into. Required whenever parentId is given, and not accepted without one.'),
    index: z.number().int().min(0).optional().describe('Zero-based position among the destination\'s children, counted before this component is detached. Omit to append at the end.'),
  }
}
