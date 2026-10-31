<script setup lang="ts">
defineProps<{
  id: string
  text?: string
}>()
</script>

<template>
  <p>{{ text }}</p>
</template>
