<script setup lang="ts">
defineProps<{
  theme?: string
}>()
</script>

<template>
  <main :data-theme="theme">
    <slot />
  </main>
</template>
