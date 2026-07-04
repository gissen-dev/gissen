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

// Snap `n` to the nearest `step` increment measured from `base`, guarding the
// floating-point drift that repeated step addition introduces (e.g. 0.1 * 3).
function snapToStep(n: number, step: number, base: number): number {
  const snapped = base + Math.round((n - base) / step) * step
  return Number.parseFloat(snapped.toPrecision(12))
}

// True when `n` satisfies the field's min/max. Step is deliberately not
// checked: off-grid values are valid data (step is a UI affordance, snapped on
// blur), and gating live commits on the grid would fight typing.
function inRange(n: number): boolean {
  const { min, max } = props.field
  return (min === undefined || n >= min) && (max === undefined || n <= max)
}

// Apply the field's min/max/step constraints to a committed value. Clamp to the
// range, snap to the step grid (anchored at min, or 0), then re-clamp in case a
// snap nudged past a bound.
function normalize(n: number): number {
  const { min, max, step } = props.field
  let result = n
  if (min !== undefined)
    result = Math.max(result, min)
  if (max !== undefined)
    result = Math.min(result, max)
  if (step !== undefined && step > 0) {
    result = snapToStep(result, step, min ?? 0)
    if (min !== undefined)
      result = Math.max(result, min)
    if (max !== undefined)
      result = Math.min(result, max)
  }
  return result
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
  // Intermediate drafts leave the model untouched (no thrash): both
  // non-parseable strings AND parsed-but-out-of-range values. The model never
  // holds an out-of-range number — an emitted `update:data` snapshot must
  // always pass `validateData`. No clamping here either (typing "5" toward
  // "50" under min: 10 must not snap); blur normalizes. (locked decisions:
  // live commit on keystroke, clamp on commit, draft rules)
  if (parsed !== undefined && inRange(parsed))
    setValue(parsed)
}

// On blur the field is committed: a valid draft is normalized to the field's
// min/max/step and both the model and the visible draft are updated. Empty or
// non-parseable drafts are left untouched (existing draft rules).
function onBlur(): void {
  const parsed = parseDraft(draft.value)
  if (parsed === undefined)
    return
  const normalized = normalize(parsed)
  draft.value = toDraft(normalized)
  if (normalized !== value.value)
    setValue(normalized)
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
    @blur="onBlur"
  >
</template>
