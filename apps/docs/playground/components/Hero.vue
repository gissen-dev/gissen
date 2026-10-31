<script setup lang="ts">
defineProps<{
  id: string
  title?: string
  subtitle?: string
  tone?: 'light' | 'dark'
}>()
</script>

<template>
  <section class="hero" :class="`hero--${tone ?? 'light'}`">
    <h1 class="hero__title">
      {{ title }}
    </h1>
    <p class="hero__subtitle">
      {{ subtitle }}
    </p>
  </section>
</template>

<style scoped>
.hero {
  padding: 32px 24px;
  font-family: system-ui, sans-serif;
  text-align: center;
}
.hero--light { background: #eef2ff; color: #1e293b; }
.hero--dark { background: #1e293b; color: #f8fafc; }
.hero__title { margin: 0 0 8px; font-size: 1.75rem; line-height: 1.2; }
.hero__subtitle { margin: 0; opacity: 0.85; }
</style>
