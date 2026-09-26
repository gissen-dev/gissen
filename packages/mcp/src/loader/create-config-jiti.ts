import type { Jiti } from 'jiti'
import { createJiti } from 'jiti'
import { STUB_MODULE_ID, STUB_MODULE_VALUE } from './stub-modules'

/**
 * Builds the jiti instance used to evaluate a user's Gissen config. Disables
 * jiti's filesystem cache: config files are small, loaded once per server
 * startup, and a stale cache across different `--config` targets in the same
 * machine is a worse failure mode than a few milliseconds of re-transpiling.
 */
export function createConfigJiti(): Jiti {
  return createJiti(import.meta.url, {
    fsCache: false,
    virtualModules: {
      [STUB_MODULE_ID]: STUB_MODULE_VALUE,
    },
  })
}
