<script setup lang="ts">
// The page root's wrapper. Deliberately a `.vue` file rather than an inline
// `defineComponent`/`h` in `gissen.config.ts`: `gissen-mcp` loads that config
// standalone — without Vue, a build pipeline, or Nuxt's auto-imports — and
// replaces every `.vue` import with an inert stub. Keeping the root's markup
// here is what keeps the config loadable by an agent as well as by the app.
</script>

<template>
  <main class="page-root">
    <slot />
  </main>
</template>

<style scoped>
.page-root {
  background: #f5f3f0;
  padding: 2rem;
}
</style>
