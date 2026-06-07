<script setup lang="ts">
defineProps<{
  id: string
  title: string
  count: number
  cta: 'signup' | 'buy'
}>()
</script>

<template>
  <section class="hero">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button>{{ cta === 'signup' ? 'Sign up' : 'Buy now' }}</button>
  </section>
</template>
