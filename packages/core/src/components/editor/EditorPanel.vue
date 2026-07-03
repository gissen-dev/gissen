<script setup lang="ts">
import type { FieldConfig } from '../../types'
import { computed } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'
import { findComponent } from '../../utils/tree'
import PropertyField from './PropertyField.vue'

const store = useEditorStore()

// Resolve the selected node by id on every read, so switching selection or an
// external data change always reflects the real current node.
const selected = computed(() => {
  if (!store.selectedId)
    return null
  return findComponent(store.data, store.selectedId)?.component ?? null
})

const componentConfig = computed(() =>
  selected.value ? store.config.components[selected.value.type] ?? null : null,
)

// Value fields only, in config order. Slots are structural (children are edited
// on the canvas via drag-and-drop), so the panel renders no editor for them.
const valueFields = computed((): Array<{ name: string, field: FieldConfig }> => {
  if (!componentConfig.value)
    return []
  return Object.entries(componentConfig.value.fields)
    .filter(([, field]) => field.type !== 'slot')
    .map(([name, field]) => ({ name, field }))
})
</script>

<template>
  <aside class="gissen-panel">
    <div class="gissen-panel__header">
      Properties
    </div>
    <div v-if="!selected" class="gissen-panel__empty">
      Select a component to edit its properties
    </div>
    <div v-else-if="valueFields.length === 0" class="gissen-panel__empty">
      This component has no editable properties
    </div>
    <div v-else class="gissen-panel__fields">
      <PropertyField
        v-for="{ name, field } in valueFields"
        :key="`${selected.props.id}/${name}`"
        :component-id="selected.props.id"
        :name="name"
        :field="field"
      />
    </div>
  </aside>
</template>
