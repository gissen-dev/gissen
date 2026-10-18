<script setup lang="ts">
import type { GissenData } from 'gissen'
import { createEmptyData, GissenEditor, validateData } from 'gissen'
import { onMounted, ref } from 'vue'
import config from '../rendering/config'
import { loadPage, savePage } from './storage'

const data = ref<GissenData>(createEmptyData(config))
const ready = ref(false)

onMounted(async () => {
  const saved = await loadPage()
  if (saved !== null)
    data.value = validateData(saved, config)
  ready.value = true
})
</script>

<template>
  <GissenEditor
    v-if="ready"
    v-model:data="data"
    :config="config"
    style="height: 100vh;"
    @update:data="savePage"
  />
</template>
