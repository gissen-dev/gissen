<script setup lang="ts">
import type { GissenData } from 'gissen'
import { createEmptyData, GissenEditor } from 'gissen'
import { ref } from 'vue'
import config from '../rendering/config'

const data = ref<GissenData>(createEmptyData(config))
</script>

<template>
  <div class="app">
    <nav>My CMS</nav>
    <GissenEditor v-model:data="data" :config="config" class="editor" />
  </div>
</template>

<style>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor {
  flex: 1;
  min-height: 0;
}
</style>
