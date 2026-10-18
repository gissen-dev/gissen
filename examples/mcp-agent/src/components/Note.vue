<script setup lang="ts">
defineProps<{
  id: string
  text?: string
}>()
</script>

<template>
  <p class="note">
    {{ text }}
  </p>
</template>

<style scoped>
.note {
  padding: 0 2rem 2rem;
  font-family: system-ui, sans-serif;
  color: #475569;
}
</style>
