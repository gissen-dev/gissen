<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'

const store = useEditorStore()

const selectedType = computed(() => {
  if (!store.selectedId)
    return null
  const content = store.data.content
  function find(nodes: typeof content): string | null {
    for (const node of nodes) {
      if (node.props.id === store.selectedId)
        return node.type
      for (const [, val] of Object.entries(node.props)) {
        if (Array.isArray(val)) {
          const found = find(val as typeof content)
          if (found)
            return found
        }
      }
    }
    return null
  }
  return find(content)
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
