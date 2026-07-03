<script setup lang="ts">
import type { SelectField } from '../../../types'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { computed } from 'vue'
import { useFieldBinding } from '../../../composables/useFieldBinding'

const props = defineProps<{
  componentId: string
  name: string
  inputId: string
  field: SelectField
}>()

const { value, setValue } = useFieldBinding(() => props.componentId, () => props.name)

// The model always holds one of the configured option values (no free text).
const current = computed(() => value.value as string | number | undefined)

function onChange(next: string | number): void {
  setValue(next)
}
</script>

<template>
  <SelectRoot :model-value="current" @update:model-value="onChange">
    <SelectTrigger :id="inputId" class="gissen-select__trigger">
      <SelectValue placeholder="Select…" />
      <span class="gissen-select__chevron" aria-hidden="true">▾</span>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="gissen-select__content" position="popper" :side-offset="4">
        <SelectViewport class="gissen-select__viewport">
          <SelectItem
            v-for="opt in field.options"
            :key="String(opt.value)"
            class="gissen-select__item"
            :value="opt.value"
          >
            <SelectItemText>{{ opt.label }}</SelectItemText>
            <SelectItemIndicator class="gissen-select__item-indicator">
              ✓
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
