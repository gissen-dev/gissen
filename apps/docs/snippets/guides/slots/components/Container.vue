<script setup lang="ts">
defineProps<{
  id: string
  columns?: number
}>()
</script>

<template>
  <div class="container" :style="{ display: 'grid', gridTemplateColumns: `repeat(${columns ?? 1}, 1fr)` }">
    <slot name="children" />
  </div>
</template>
