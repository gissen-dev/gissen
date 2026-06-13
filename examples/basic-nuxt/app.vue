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
        id: 'hero-1',
        title: 'Build pages visually',
        subtitle: 'Drag and drop your own Vue components onto a canvas. The output is plain JSON — render it anywhere.',
        cta: 'get-started',
      },
    },
    {
      type: 'TextBlock',
      props: {
        id: 'text-1',
        heading: 'How it works',
        body: 'Register your Vue components with a typed config. Users drag them onto the canvas — the output is plain JSON you render anywhere.',
      },
    },
    {
      type: 'Container',
      props: {
        id: 'container-1',
        children: [
          {
            type: 'FeatureCard',
            props: {
              id: 'feature-headless',
              icon: '🧩',
              title: 'Headless',
              description: 'Your components, your styles. Gissen is a runtime, not a UI framework.',
            },
          },
          {
            type: 'FeatureCard',
            props: {
              id: 'feature-typesafe',
              icon: '🔷',
              title: 'Type-safe',
              description: 'Prop types are inferred from your field definitions. Mismatches are caught at compile time.',
            },
          },
          {
            type: 'FeatureCard',
            props: {
              id: 'feature-agent',
              icon: '🤖',
              title: 'Agent-native',
              description: 'An MCP server lets AI agents build pages programmatically — same JSON, same config.',
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
