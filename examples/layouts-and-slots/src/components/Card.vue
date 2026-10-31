<script setup lang="ts">
// A leaf component: no slot of its own, so it can go inside a Column but
// never contain anything. Its fields show the two types this example is
// for: select (`size`) and number (`rating`).
const props = defineProps<{
  id: string
  title?: string
  rating?: number
  size?: 'sm' | 'md' | 'lg'
}>()

// `rating` is a number field without a `step`, so a hand-edited document
// could hold a non-integer or an out-of-range value; `repeat()` throws on
// either. Clamp and round rather than trust the stored value.
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
  padding: 16px;
  font-family: system-ui, sans-serif;
}
.card--sm { font-size: 0.85rem; }
.card--md { font-size: 1rem; }
.card--lg { font-size: 1.2rem; }
.card__title {
  margin: 0 0 8px;
  font-weight: 700;
  color: #1e293b;
}
.card__rating {
  margin: 0;
  color: #f59e0b;
  letter-spacing: 2px;
}
</style>
