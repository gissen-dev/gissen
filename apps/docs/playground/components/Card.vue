<script setup lang="ts">
const props = defineProps<{
  id: string
  title?: string
  rating?: number
  size?: 'sm' | 'md' | 'lg'
}>()

// A hand-edited document can hold a non-integer or out-of-range rating, and
// String.prototype.repeat throws on both, so clamp and round.
const filledStars = Math.min(5, Math.max(0, Math.round(props.rating ?? 0)))
</script>

<template>
  <div class="card" :class="`card--${size ?? 'md'}`">
    <h3 class="card__title">
      {{ title }}
    </h3>
    <p class="card__rating">
      {{ '★'.repeat(filledStars) }}{{ '☆'.repeat(5 - filledStars) }}
    </p>
  </div>
</template>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  font-family: system-ui, sans-serif;
}
.card--sm { font-size: 0.85rem; }
.card--md { font-size: 1rem; }
.card--lg { font-size: 1.2rem; }
.card__title { margin: 0 0 6px; font-weight: 700; color: #1e293b; }
.card__rating { margin: 0; color: #f59e0b; letter-spacing: 2px; }
</style>
