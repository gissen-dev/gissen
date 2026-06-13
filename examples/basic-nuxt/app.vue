<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from './gissen.config'

const data = ref<GissenData>({
  root: { props: {} },
  content: [
    {
      type: 'Hero',
      props: {
        id: 'hero-seed-1',
        title: 'Welcome to Gissen',
        count: 42,
        cta: 'signup',
      },
    },
    {
      type: 'Container',
      props: {
        id: 'container-seed-1',
        children: [
          {
            type: 'PricingCard',
            props: {
              id: 'pricing-seed-1',
              name: 'Pro Plan',
              featured: true,
              features: [],
            },
          },
        ],
      },
    },
  ],
})
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column;">
    <GissenEditor v-model:data="data" :config="config" style="flex: 1; min-height: 0;" />
  </div>
</template>

<style>
@import 'gissen/style.css';

* { box-sizing: border-box; }
body { margin: 0; }
</style>
