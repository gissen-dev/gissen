<script setup lang="ts">
defineProps<{
  id: string
  title?: string
}>()
</script>

<template>
  <section>
    <h1>{{ title }}</h1>
  </section>
</template>
