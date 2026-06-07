import { z } from 'zod'

/** Zod schema matching `ComponentData` basic shape (shallow — slot children are validated recursively). */
export const componentDataSchema = z.object({
  type: z.string().min(1, 'Component type must be a non-empty string'),
  props: z.object({ id: z.string().min(1, 'Component id must be a non-empty string') }).catchall(z.unknown()),
})

/** Zod schema matching `RootData`. */
export const rootDataSchema = z.object({
  props: z.record(z.unknown()),
})

/** Zod schema matching the top-level `GissenData` shape. */
export const gissenDataSchema = z.object({
  root: rootDataSchema,
  content: z.array(componentDataSchema),
})
