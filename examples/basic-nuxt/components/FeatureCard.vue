<script setup lang="ts">
defineProps<{
  id: string
  icon: string
  title: string
  description: string
  badge: number
  highlighted: boolean
}>()
</script>

<template>
  <div
    class="feature-card"
    :class="{ 'feature-card--highlighted': highlighted }"
  >
    <span v-if="badge != null" class="feature-card__badge">{{ badge }}</span>
    <div class="feature-card__icon">{{ icon }}</div>
    <h3 class="feature-card__title">{{ title }}</h3>
    <p class="feature-card__description">{{ description }}</p>
  </div>
</template>

<style scoped>
.feature-card {
  position: relative;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 32px;
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.feature-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.08);
}
.feature-card--highlighted {
  border-color: #6366f1;
  background: #eef2ff;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.16);
}
.feature-card__badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: #6366f1;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1;
}
.feature-card__icon {
  font-size: 2rem;
  line-height: 1;
}
.feature-card__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.feature-card__description {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}
</style>
