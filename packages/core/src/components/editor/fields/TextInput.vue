<script setup lang="ts">
import { computed } from 'vue'
import { useFieldBinding } from '../../../composables/useFieldBinding'

const props = defineProps<{
  componentId: string
  name: string
  inputId: string
}>()

const { value, setValue } = useFieldBinding(() => props.componentId, () => props.name)

// Display a string; a missing value shows empty rather than "undefined".
const text = computed(() => (value.value == null ? '' : String(value.value)))

function onInput(e: Event): void {
  // Clearing the field yields "" (empty string), never undefined — per spec.
  setValue((e.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    :id="inputId"
    class="gissen-field__input"
    type="text"
    :value="text"
    @input="onInput"
  >
</template>
