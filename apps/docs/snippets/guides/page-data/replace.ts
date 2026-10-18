import type { GissenData } from 'gissen'
import type { Ref } from 'vue'
import { validateData } from 'gissen'
import config from '../rendering/config'

// The editor validates `data` once, at mount. When you swap in a whole new
// document later, validate it yourself first.
export function replaceDocument(data: Ref<GissenData>, incoming: unknown): void {
  data.value = validateData(incoming, config)
}
