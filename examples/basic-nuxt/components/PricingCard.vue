<script setup lang="ts">
import type { ComponentData } from 'gissen'

defineProps<{
  id: string
  name: string
  featured: boolean
  features: ComponentData[]
}>()
</script>

<template>
  <div class="pricing-card" :class="{ 'pricing-card--featured': featured }">
    <h2>{{ name }}</h2>
    <!-- Slot convention: the editor passes rendered children via the named slot "features" -->
    <slot name="features" />
  </div>
</template>
