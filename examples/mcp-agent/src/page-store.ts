import type { GissenData } from 'gissen/render'
import { GissenValidationError, validateData } from 'gissen'
import { ref } from 'vue'
import config from '../gissen.config'
import rawPage from '../page.json'

const emptyPage: GissenData = { version: 1, root: { props: {} }, content: [] }

/**
 * Validates, but never throws: an in-progress or stale edit to page.json
 * (from gissen-mcp, or from a hand edit) must not crash the page or Vite's
 * HMR overlay. Logs and falls back to the last-known-good value instead.
 */
function toGissenData(raw: unknown, fallback: GissenData): GissenData {
  try {
    return validateData(raw, config)
  }
  catch (error) {
    if (error instanceof GissenValidationError) {
      console.error('[mcp-agent] page.json does not match gissen.config.ts:', error.message)
      return fallback
    }
    throw error
  }
}

/** The single source the app renders from. */
export const data = ref<GissenData>(toGissenData(rawPage, emptyPage))

/**
 * Self-accepting HMR: gissen-mcp rewrites page.json atomically on every
 * successful tool call. That invalidates this module's import of it, and
 * because this module claims the update with `accept`, Vite re-executes
 * this file instead of reloading the page. The re-executed module is a new
 * instance with its own new `data` ref; copying its `.value` into the
 * ORIGINAL ref (the one App.vue already holds) is what makes the change
 * show up without a reload — the binding's identity never changes, only
 * its value.
 */
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule)
      data.value = newModule.data.value
  })
}
