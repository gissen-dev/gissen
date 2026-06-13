<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'
import { useCanvasZoneDnD } from '../../composables/useGissenDnD'
import { useSelection } from '../../composables/useSelection'
import CanvasNode from './CanvasNode.vue'

const store = useEditorStore()

useSelection()

const innerEl = ref<HTMLElement | null>(null)
useCanvasZoneDnD(innerEl, () => ({ parentId: null, slotName: null }))
</script>

<template>
  <main class="gissen-canvas">
    <div ref="innerEl" class="gissen-canvas__inner">
      <div v-if="store.data.content.length === 0" class="gissen-canvas__empty">
        <p class="gissen-canvas__empty-title">
          Canvas is empty
        </p>
        <p class="gissen-canvas__empty-hint">
          Drag components from the sidebar to get started
        </p>
      </div>
      <template v-else>
        <CanvasNode
          v-for="component in store.data.content"
          :key="component.props.id"
          :component="component"
        />
      </template>
    </div>
  </main>
</template>
