<script setup lang="ts">
defineProps<{
  id: string
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section class="hero">
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
  </section>
</template>

<style scoped>
.hero {
  padding: 2rem;
  font-family: system-ui, sans-serif;
}
</style>
