<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'
import { findComponent } from '../../utils/tree'

const store = useEditorStore()

const selectedType = computed(() => {
  if (!store.selectedId)
    return null
  return findComponent(store.data, store.selectedId)?.component.type ?? null
})
</script>

<template>
  <aside class="gissen-panel">
    <div class="gissen-panel__header">
      Properties
    </div>
    <div v-if="!store.selectedId" class="gissen-panel__empty">
      Nothing selected
    </div>
    <div v-else class="gissen-panel__selected-type">
      <strong>{{ selectedType }}</strong>
      <br>
      <span>Field editing coming in Phase 4</span>
    </div>
  </aside>
</template>
