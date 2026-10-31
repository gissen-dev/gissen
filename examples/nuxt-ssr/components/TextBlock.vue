<script setup lang="ts">
defineProps<{
  id: string
  heading: string
  body: string
}>()
</script>

<template>
  <div class="text-block">
    <h2 class="text-block__heading">{{ heading }}</h2>
    <p class="text-block__body">{{ body }}</p>
  </div>
</template>

<style scoped>
.text-block {
  padding: clamp(24px, 6cqw, 48px);
  font-family: system-ui, sans-serif;
  max-width: 720px;
  margin: 0 auto;
}
.text-block__heading {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}
.text-block__body {
  font-size: 1.05rem;
  color: #64748b;
  line-height: 1.7;
  margin: 0;
}
</style>
