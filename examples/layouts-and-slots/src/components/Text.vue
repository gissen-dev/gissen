<script setup lang="ts">
defineProps<{
  id: string
  body?: string
}>()
</script>

<template>
  <p class="text">
    {{ body }}
  </p>
</template>

<style scoped>
.text {
  margin: 0;
  font-family: system-ui, sans-serif;
  color: #475569;
  line-height: 1.6;
}
</style>
