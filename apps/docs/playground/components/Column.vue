<script setup lang="ts">
// Its `children` slot only accepts `Card` and `Text`.
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
  gap: 12px;
  min-width: 0;
}
.column :deep(.gissen-slot) {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
