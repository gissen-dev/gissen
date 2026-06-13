<script setup lang="ts">
import type { ComponentData } from '../../types'
import { ref } from 'vue'
import { useCanvasZoneDnD } from '../../composables/useGissenDnD'
import CanvasNode from './CanvasNode.vue'

const props = defineProps<{
  parentId: string
  slotName: string
  children: ComponentData[]
}>()

const slotEl = ref<HTMLElement | null>(null)
useCanvasZoneDnD(slotEl, () => ({ parentId: props.parentId, slotName: props.slotName }))
</script>

<template>
  <div ref="slotEl" class="gissen-slot" :data-gissen-slot="slotName" :data-gissen-parent="parentId">
    <template v-if="children.length > 0">
      <CanvasNode
        v-for="child in children"
        :key="child.props.id"
        :component="child"
      />
    </template>
    <div v-else class="gissen-slot--empty">
      Drop here
    </div>
  </div>
</template>
