import type { GissenConfig } from '../types'
import { ZodError } from 'zod'
import { gissenConfigSchema } from './config-schemas'
import { GissenValidationError } from './errors'

/**
 * Validates that `config` is a well-formed `GissenConfig`.
 * Throws `GissenValidationError` on failure; returns a typed config on success.
 */
export function validateConfig(config: unknown): GissenConfig {
  try {
    return gissenConfigSchema.parse(config) as GissenConfig
  }
  catch (error) {
    if (error instanceof ZodError)
      throw new GissenValidationError(error)
    throw error
  }
}
