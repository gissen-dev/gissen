<script setup lang="ts">
import type { GissenData } from 'gissen'
import { createEmptyData, GissenEditor, GissenRender } from 'gissen'
import { ref } from 'vue'
import config from './config'

const data = ref<GissenData>(createEmptyData(config))
</script>

<template>
  <div class="split">
    <GissenEditor v-model:data="data" :config="config" />
    <GissenRender :config="config" :data="data" />
  </div>
</template>
