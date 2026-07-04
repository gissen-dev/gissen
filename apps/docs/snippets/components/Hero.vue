<script setup lang="ts">
// Mirrors the `Hero` field config in config-api.md so the docs snippet
// typechecks against the exported Gissen types.
defineProps<{
  id: string
  title: string
  count: number
  cta: 'signup' | 'buy'
}>()
</script>

<template>
  <section>{{ title }}</section>
</template>
