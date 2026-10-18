<script setup lang="ts">
defineProps<{
  id: string
  rating?: number
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <article class="card" :class="`card--${size ?? 'md'}`">
    {{ rating }}
  </article>
</template>
