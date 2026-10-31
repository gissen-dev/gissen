<script setup lang="ts">
defineProps<{
  id: string
  heading?: string
}>()
</script>

<template>
  <article>
    <h2>{{ heading }}</h2>
    <slot name="body" />
  </article>
</template>
