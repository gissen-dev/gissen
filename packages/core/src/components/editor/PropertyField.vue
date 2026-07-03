<script setup lang="ts">
import type { FieldConfig } from '../../types'
import { Label } from 'reka-ui'
import { computed } from 'vue'
import BooleanInput from './fields/BooleanInput.vue'
import NumberInput from './fields/NumberInput.vue'
import SelectInput from './fields/SelectInput.vue'
import TextareaInput from './fields/TextareaInput.vue'
import TextInput from './fields/TextInput.vue'

const props = defineProps<{
  componentId: string
  name: string
  field: FieldConfig
}>()

// Unique, stable id links the <label> to its control for a11y. Includes the
// component id so two components never collide on the same field name.
const inputId = computed(() => `gissen-field-${props.componentId}-${props.name}`)

const label = computed(() => props.field.label ?? props.name)
</script>

<template>
  <div class="gissen-field">
    <Label :for="inputId" class="gissen-field__label">{{ label }}</Label>
    <!-- `field.type` narrows the union, so each control receives its exact field type. -->
    <TextInput
      v-if="field.type === 'text'"
      :component-id="componentId"
      :name="name"
      :input-id="inputId"
    />
    <TextareaInput
      v-else-if="field.type === 'textarea'"
      :component-id="componentId"
      :name="name"
      :input-id="inputId"
      :field="field"
    />
    <NumberInput
      v-else-if="field.type === 'number'"
      :component-id="componentId"
      :name="name"
      :input-id="inputId"
      :field="field"
    />
    <SelectInput
      v-else-if="field.type === 'select'"
      :component-id="componentId"
      :name="name"
      :input-id="inputId"
      :field="field"
    />
    <BooleanInput
      v-else-if="field.type === 'boolean'"
      :component-id="componentId"
      :name="name"
      :input-id="inputId"
    />
  </div>
</template>
