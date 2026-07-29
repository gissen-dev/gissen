<script setup lang="ts">
// Mirrors the `root.render` component in rendering.md: receives
// `data.root.props` as props and the page content via the default slot.
defineProps<{
  theme?: string
}>()
</script>

<template>
  <main :data-theme="theme">
    <slot />
  </main>
</template>
