<script setup lang="ts">
defineProps<{
  id: string
  title?: string
  subtitle?: string
  rating?: number
  active?: boolean
  theme?: string
}>()
</script>

<template>
  <section class="hero">
    <h1>{{ title }}</h1>
    <p>{{ subtitle }}</p>
    <span v-if="active" class="badge">{{ rating }} / 5</span>
  </section>
</template>

<style scoped>
.hero {
  padding: 2rem;
}
</style>
