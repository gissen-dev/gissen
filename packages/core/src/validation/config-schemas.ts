import { z } from 'zod'
import { fieldConfigSchema } from './field-schemas'

/** Zod schema matching `ComponentConfig` at runtime. */
export const componentConfigSchema = z
  .object({
    fields: z.record(fieldConfigSchema),
    defaultProps: z.record(z.unknown()).optional(),
    render: z.union([z.function(), z.object({}).passthrough()]).refine(
      value => value !== null && value !== undefined,
      { message: 'render must be a Vue component (function or object)' },
    ),
  })
  .refine(
    (config) => {
      if (!config.defaultProps)
        return true
      const fieldKeys = new Set(Object.keys(config.fields))
      const extraKeys = Object.keys(config.defaultProps).filter(k => !fieldKeys.has(k))
      return extraKeys.length === 0
    },
    (config) => {
      const fieldKeys = new Set(Object.keys(config.fields))
      const extraKeys = Object.keys(config.defaultProps ?? {}).filter(k => !fieldKeys.has(k))
      return { message: `defaultProps contains keys not present in fields: ${extraKeys.join(', ')}`, path: ['defaultProps'] }
    },
  )
  .refine(
    (config) => {
      if (!config.defaultProps)
        return true
      for (const [key, field] of Object.entries(config.fields)) {
        if (field.type !== 'select')
          continue
        const value = config.defaultProps[key]
        if (value === undefined)
          continue
        const allowed = field.options.map((o: { value: string | number }) => o.value)
        if (!allowed.includes(value as string | number))
          return false
      }
      return true
    },
    (config) => {
      for (const [key, field] of Object.entries(config.fields)) {
        if (field.type !== 'select')
          continue
        const value = config.defaultProps?.[key]
        if (value === undefined)
          continue
        const allowed = field.options.map((o: { value: string | number }) => o.value)
        if (!allowed.includes(value as string | number)) {
          return {
            message: `defaultProps.${key} value "${String(value)}" is not among the select options: ${allowed.map(String).join(', ')}`,
            path: ['defaultProps', key],
          }
        }
      }
      return { message: 'select defaultProps validation failed', path: ['defaultProps'] }
    },
  )

/** Zod schema matching the top-level `GissenConfig`. */
export const gissenConfigSchema = z.object({
  components: z.record(componentConfigSchema),
  root: z
    .object({
      fields: z.record(fieldConfigSchema).optional(),
      defaultProps: z.record(z.unknown()).optional(),
      render: z.union([z.function(), z.object({}).passthrough()]).optional(),
    })
    .optional(),
})
