<script setup lang="ts">
import type { NumberField } from '../../../types'
import { ref, watch } from 'vue'
import { useFieldBinding } from '../../../composables/useFieldBinding'

const props = defineProps<{
  componentId: string
  name: string
  inputId: string
  field: NumberField
}>()

const { value, setValue } = useFieldBinding(() => props.componentId, () => props.name)

// The <input> is bound to this local string draft, NOT to the model directly,
// so the user can type intermediate non-numbers (`-`, `1.`, empty) without the
// value snapping or the caret jumping. (locked decision #3)
const draft = ref('')

// A model value → its input string. Non-finite / non-number shows empty.
function toDraft(v: unknown): string {
  return typeof v === 'number' && Number.isFinite(v) ? String(v) : ''
}

// A draft string → a finite number, or undefined when it isn't one (empty,
// or an intermediate like `-`, `1.`, `1e`).
function parseDraft(s: string): number | undefined {
  const trimmed = s.trim()
  if (trimmed === '')
    return undefined
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

// Seed on mount and re-seed when the model value changes externally (e.g. the
// `data` prop is replaced upstream) — but only when it disagrees with what the
// draft already represents, so committing a value mid-type never resets the
// caret. Selection changes remount this component (keyed by id upstream), which
// re-seeds via `immediate`.
watch(value, (v) => {
  if (parseDraft(draft.value) !== v)
    draft.value = toDraft(v)
}, { immediate: true })

function onInput(e: Event): void {
  const next = (e.target as HTMLInputElement).value
  draft.value = next
  if (next.trim() === '') {
    // Clearing the field stores undefined — never silently 0. (locked decision #4)
    setValue(undefined)
    return
  }
  const parsed = parseDraft(next)
  // Intermediate, non-parseable drafts leave the model untouched (no thrash).
  if (parsed !== undefined)
    setValue(parsed)
}
</script>

<template>
  <input
    :id="inputId"
    class="gissen-field__input"
    type="text"
    inputmode="decimal"
    :value="draft"
    @input="onInput"
  >
</template>
