// Typecheck fixture for the editor.md "Basic usage" snippet. The documented
// `GissenData` value omits `version` — this must be type-valid (H-1: version is
// optional, matching the tolerant validator).

import type { GissenData } from 'gissen'
import { ref } from 'vue'

const data = ref<GissenData>({ root: { props: {} }, content: [] })

void data
