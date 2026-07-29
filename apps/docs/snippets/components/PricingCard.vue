<script setup lang="ts">
// Mirrors the `PricingCard` field config in config-api.md, including the slot
// convention: the `features` slot field maps to a named slot, NOT a prop —
// the props a component receives are its non-slot fields plus `id`.
defineProps<{
  id: string
  name: string
  featured: boolean
}>()
</script>

<template>
  <div class="pricing-card">
    <h2>{{ name }}</h2>
    <ul>
      <slot name="features" />
    </ul>
  </div>
</template>
