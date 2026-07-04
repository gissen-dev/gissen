<script setup lang="ts">
import type { ComponentData } from 'gissen'

// Mirrors the `PricingCard` field config in config-api.md, including the slot
// convention (a `features` slot field requires a matching named slot).
defineProps<{
  id: string
  name: string
  featured: boolean
  features: ComponentData[]
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
