<script setup lang="ts">
// Nested one level inside Columns. Its own `children` slot accepts `Card`
// or `Text` (not another `Columns` or `Column`) — the allow list is set per
// slot, so each level of nesting can have its own rules.
defineProps<{
  id: string
  width?: number
}>()
</script>

<template>
  <div class="column" :style="{ flex: width ?? 1 }">
    <slot name="children" />
  </div>
</template>

<style scoped>
.column {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* Same reasoning as Columns.vue: match the editor's .gissen-slot wrapper to
   this component's own layout so editing and rendering look the same. */
.column :deep(.gissen-slot) {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
