import type { GissenData } from 'gissen'
import { validateData } from 'gissen'
import config from './config'

// Throws GissenValidationError when `rawData` does not match the config,
// for example when a component type was removed from it.
export function parseStrict(rawData: unknown): GissenData {
  return validateData(rawData, config)
}
