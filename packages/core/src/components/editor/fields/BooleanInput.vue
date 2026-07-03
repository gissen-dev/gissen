<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import { computed } from 'vue'
import { useFieldBinding } from '../../../composables/useFieldBinding'

const props = defineProps<{
  componentId: string
  name: string
  inputId: string
}>()

const { value, setValue } = useFieldBinding(() => props.componentId, () => props.name)

// Coerce to a real boolean for display; the model always stores true/false.
const checked = computed(() => value.value === true)

function onChange(next: boolean): void {
  setValue(next === true)
}
</script>

<template>
  <SwitchRoot
    :id="inputId"
    class="gissen-field__switch"
    :model-value="checked"
    @update:model-value="onChange"
  >
    <SwitchThumb class="gissen-field__switch-thumb" />
  </SwitchRoot>
</template>
