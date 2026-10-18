<script setup lang="ts">
import type { ComponentData } from 'gissen'

defineProps<{
  id: string
  name: string
  price: string
  featured: boolean
  features: ComponentData[]
}>()
</script>

<template>
  <div class="pricing-card" :class="{ 'pricing-card--featured': featured }">
    <div class="pricing-card__header">
      <span v-if="featured" class="pricing-card__badge">Most popular</span>
      <h3 class="pricing-card__name">{{ name }}</h3>
      <div class="pricing-card__price">{{ price }}</div>
    </div>
    <div class="pricing-card__features">
      <slot name="features" />
    </div>
    <button class="pricing-card__cta">
      {{ featured ? 'Start free trial' : 'Get started' }}
    </button>
  </div>
</template>

<style scoped>
.pricing-card {
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: box-shadow 0.2s;
}
.pricing-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
}
.pricing-card--featured {
  border-color: #6366f1;
  background: linear-gradient(180deg, #faf5ff 0%, #fff 60%);
}
.pricing-card__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pricing-card__badge {
  display: inline-block;
  background: #6366f1;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 20px;
  align-self: flex-start;
}
.pricing-card__name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.pricing-card__price {
  font-size: 2.25rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.03em;
}
.pricing-card__features {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.pricing-card__cta {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  background: #6366f1;
  color: #fff;
  transition: background 0.15s;
}
.pricing-card--featured .pricing-card__cta {
  background: #6366f1;
}
.pricing-card:not(.pricing-card--featured) .pricing-card__cta {
  background: #f1f5f9;
  color: #1e293b;
}
.pricing-card__cta:hover {
  opacity: 0.9;
}
</style>
