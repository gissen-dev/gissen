<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor, GissenRender } from 'gissen'
import { ref } from 'vue'
import config from './gissen.config'
import { samplePage } from './sample-page'

const data = ref<GissenData>(samplePage())
</script>

<template>
  <div class="layout">
    <GissenEditor v-model:data="data" :config="config" />
    <div class="preview">
      <GissenRender :config="config" :data="data" />
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
}

.layout {
  display: grid;
  grid-template-rows: 2fr 1fr;
  height: 100vh;
}

.preview {
  overflow: auto;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}
</style>
