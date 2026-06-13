<script setup lang="ts">
import type { GissenConfig, GissenData } from '../types'
import { onMounted, watch } from 'vue'
import { createEditorStore, provideEditorStore } from '../composables/useEditorStore'
import { validateConfig } from '../validation'
import EditorCanvas from './editor/EditorCanvas.vue'
import EditorPanel from './editor/EditorPanel.vue'
import EditorSidebar from './editor/EditorSidebar.vue'

const props = defineProps<{ config: GissenConfig }>()
const modelData = defineModel<GissenData>('data', { required: true })

onMounted(() => {
  validateConfig(props.config)
})

const store = createEditorStore(props.config, modelData.value)
provideEditorStore(store)

// Push store mutations to the v-model
watch(
  () => store.data,
  (newData) => {
    if (newData !== modelData.value) {
      modelData.value = newData
    }
  },
  { deep: true },
)

// Accept external data replacement (e.g. load/reset from parent)
watch(modelData, (newData) => {
  if (newData !== store.data) {
    store.data = newData
  }
})
</script>

<template>
  <div class="gissen-editor">
    <EditorSidebar :config="config" />
    <EditorCanvas />
    <EditorPanel />
  </div>
</template>

<style>
@import '../styles/editor.css';
</style>
