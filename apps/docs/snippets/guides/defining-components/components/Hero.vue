<script setup lang="ts">
defineProps<{
  id: string
  title?: string
  count?: number
  cta?: 'signup' | 'buy'
}>()
</script>

<template>
  <section>
    <h1>{{ title }}</h1>
    <p>{{ count }}</p>
    <button>{{ cta }}</button>
  </section>
</template>
