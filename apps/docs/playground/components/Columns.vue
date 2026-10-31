<script setup lang="ts">
// Its `columns` slot only accepts `Column` (see config.ts).
defineProps<{
  id: string
}>()
</script>

<template>
  <div class="columns">
    <slot name="columns" />
  </div>
</template>

<style scoped>
.columns {
  display: flex;
  gap: 16px;
  padding: 16px;
  align-items: flex-start;
}

/* In the editor the slot's direct child is gissen's own .gissen-slot wrapper
   and each child sits in a .gissen-node; match them to this layout so the
   canvas looks like GissenRender's output. */
.columns :deep(.gissen-slot) {
  display: flex;
  gap: 16px;
  width: 100%;
}
.columns :deep(.gissen-slot > .gissen-node) {
  flex: 1;
  min-width: 0;
}
</style>
