<script setup lang="ts">
// Top-level layout component. Its `columns` slot only accepts `Column`
// (the config's `allow` list), so this is always a row of columns, never a
// stray card or text block placed directly here.
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
  gap: 24px;
  padding: 24px;
  align-items: flex-start;
}

/* In the editor, direct children of the named slot are gissen's own
   .gissen-slot / .gissen-node wrappers (see the Editor guide), not Column
   itself — style those so editor and render match. */
.columns :deep(.gissen-slot) {
  display: flex;
  gap: 24px;
  width: 100%;
}
.columns :deep(.gissen-slot > .gissen-node) {
  flex: 1;
  min-width: 0;
}
</style>
