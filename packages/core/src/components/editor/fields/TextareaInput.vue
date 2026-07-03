<script setup lang="ts">
import type { TextareaField } from '../../../types'
import { computed } from 'vue'
import { useFieldBinding } from '../../../composables/useFieldBinding'

const props = defineProps<{
  componentId: string
  name: string
  inputId: string
  field: TextareaField
}>()

const { value, setValue } = useFieldBinding(() => props.componentId, () => props.name)

const text = computed(() => (value.value == null ? '' : String(value.value)))

function onInput(e: Event): void {
  // Clearing the field yields "" (empty string), never undefined — per spec.
  setValue((e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    :id="inputId"
    class="gissen-field__textarea"
    :rows="field.rows ?? 3"
    :value="text"
    @input="onInput"
  />
</template>
