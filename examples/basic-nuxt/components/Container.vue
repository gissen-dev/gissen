<script setup lang="ts">
import type { ComponentData } from 'gissen'

defineProps<{
  id: string
  children: ComponentData[]
}>()
</script>

<template>
  <section class="container-block">
    <slot name="children" />
  </section>
</template>

<style scoped>
.container-block {
  padding: 24px;
  background: #f8fafc;
  font-family: system-ui, sans-serif;
  /* production rendering: direct children are flex items */
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: stretch;
}

/* production: children get equal width */
.container-block > * {
  flex: 1;
  min-width: 240px;
}

/* editor: .gissen-slot is the only child — make it a flex row too */
.container-block :deep(.gissen-slot) {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: stretch;
  flex: 1;
}
.container-block :deep(.gissen-slot > *) {
  flex: 1;
  min-width: 240px;
}
</style>
