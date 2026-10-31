<script setup lang="ts">
defineProps<{
  id: string
  title?: string
}>()
</script>

<template>
  <section class="hero">
    <h1>{{ title }}</h1>
  </section>
</template>
