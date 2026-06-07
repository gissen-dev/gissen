import { z } from 'zod'

const fieldBaseSchema = z.object({
  label: z.string().optional(),
})

/** Zod schema matching `TextField`. */
export const textFieldSchema = fieldBaseSchema.extend({
  type: z.literal('text'),
})

/** Zod schema matching `TextareaField`. */
export const textareaFieldSchema = fieldBaseSchema.extend({
  type: z.literal('textarea'),
  rows: z.number().int().positive().optional(),
})

/** Zod schema matching `NumberField`. */
export const numberFieldSchema = fieldBaseSchema.extend({
  type: z.literal('number'),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
})

/** Zod schema matching `SelectField` (runtime-permissive; options values may be string or number). */
export const selectFieldSchema = fieldBaseSchema.extend({
  type: z.literal('select'),
  options: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })).min(1),
})

/** Zod schema matching `BooleanField`. */
export const booleanFieldSchema = fieldBaseSchema.extend({
  type: z.literal('boolean'),
})

/** Zod schema matching `SlotField`. */
export const slotFieldSchema = fieldBaseSchema.extend({
  type: z.literal('slot'),
  allow: z.array(z.string()).readonly().optional(),
})

/** Discriminated union of all six supported field config schemas. */
export const fieldConfigSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  numberFieldSchema,
  selectFieldSchema,
  booleanFieldSchema,
  slotFieldSchema,
])
