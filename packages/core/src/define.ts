import type { GissenConfig } from './types'

/**
 * Identity helper that provides full type inference for a Gissen config object,
 * mirroring the `defineConfig` pattern used by Vite. At runtime it simply
 * returns the config it is given.
 */
export function defineGissenConfig<T extends GissenConfig>(config: T): T {
  return config
}
