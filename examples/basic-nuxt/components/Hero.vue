<script setup lang="ts">
defineProps<{
  id: string
  title: string
  subtitle: string
  cta: 'get-started' | 'learn-more'
}>()
</script>

<template>
  <section class="hero">
    <h1 class="hero__title">{{ title }}</h1>
    <p class="hero__subtitle">{{ subtitle }}</p>
    <button class="hero__cta">
      {{ cta === 'get-started' ? 'Get started free' : 'Learn more →' }}
    </button>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  padding: 80px 48px;
  text-align: center;
  font-family: system-ui, sans-serif;
}
.hero__title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 16px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.hero__subtitle {
  font-size: 1.2rem;
  margin: 0 0 36px;
  opacity: 0.88;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
}
.hero__cta {
  background: #fff;
  color: #6366f1;
  border: none;
  padding: 14px 36px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
}
.hero__cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 28px rgba(0,0,0,0.2);
}
</style>
