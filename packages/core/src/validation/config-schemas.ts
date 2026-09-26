import { z } from 'zod'
import { fieldConfigSchema } from './field-schemas'
import { validateScalarFieldValue } from './field-value-rules'

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
    config => !Object.hasOwn(config.fields, 'id'),
    {
      message: '"id" is a reserved prop key and cannot be used as a field name — it is the node identity used for selection, move, and removal',
      path: ['fields', 'id'],
    },
  )
  .superRefine((config, ctx) => {
    const defaultProps = config.defaultProps
    if (!defaultProps)
      return

    const fields = config.fields

    for (const [key, value] of Object.entries(defaultProps)) {
      if (key === 'id') {
        ctx.addIssue({
          code: 'custom',
          message: `defaultProps."id" is invalid: "id" is a reserved prop key generated automatically for every node and cannot be set via defaultProps (got ${JSON.stringify(value)})`,
          path: ['defaultProps', 'id'],
        })
        continue
      }

      if (!Object.hasOwn(fields, key)) {
        ctx.addIssue({
          code: 'custom',
          message: `defaultProps.${key} is invalid: "${key}" does not correspond to a declared field (got ${JSON.stringify(value)})`,
          path: ['defaultProps', key],
        })
      }
    }

    // `defaultProps` for slot fields is deliberately not validated here. A
    // full check needs the fully assembled `GissenConfig` to resolve
    // cross-component `allow` lists, unavailable while a single component's
    // schema is still being parsed — but even the shape-only part (e.g.
    // "must be an array") is skipped by choice, not blocked by that; see
    // AUDIT_BACKLOG.md for why a partial check isn't worth it.
    for (const [key, field] of Object.entries(fields)) {
      if (field.type === 'slot')
        continue

      const value = defaultProps[key]
      if (value === undefined)
        continue

      // A config-declared default must be a real value, not a signal to
      // clear the field — `null` is a config-authoring mistake here, unlike
      // in an agent's `update_component` request.
      if (value === null) {
        ctx.addIssue({
          code: 'custom',
          message: `defaultProps.${key} is invalid: a default value cannot be null — omit the key entirely if the field should start unset`,
          path: ['defaultProps', key],
        })
        continue
      }

      // Same reasoning as `null`: a non-finite default is a config-authoring
      // mistake, and it cannot even survive a JSON round-trip (`NaN`/`Infinity`
      // serialize to `null`). `validateScalarFieldValue`'s min/max comparisons
      // don't catch this — `NaN < min` and `NaN > max` are both `false` — so it
      // must be checked here explicitly, kept out of the shared function so
      // `validateData`'s behavior is unchanged.
      if (field.type === 'number' && typeof value === 'number' && !Number.isFinite(value)) {
        ctx.addIssue({
          code: 'custom',
          message: `defaultProps.${key} is invalid: a default must be a finite number (got ${String(value)})`,
          path: ['defaultProps', key],
        })
        continue
      }

      for (const issue of validateScalarFieldValue(field, value, key, ['defaultProps', key]))
        ctx.addIssue(issue)
    }
  })

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
