<script setup lang="ts">
import type { GissenConfig, GissenData } from '../types'
import { watch } from 'vue'
import { createEditorStore, provideEditorStore } from '../composables/useEditorStore'
import { validateConfig } from '../validation'
import EditorCanvas from './editor/EditorCanvas.vue'
import EditorPanel from './editor/EditorPanel.vue'
import EditorSidebar from './editor/EditorSidebar.vue'

const props = defineProps<{ config: GissenConfig }>()
const modelData = defineModel<GissenData>('data', { required: true })

// Fail fast on a malformed config, before the store is built from it.
// Runs synchronously (no DOM needed) so it also guards SSR.
validateConfig(props.config)

// `config` is reactive: passing a getter lets the store, sidebar and canvas
// react to a swapped config instead of silently keeping the original. Each new
// config is re-validated (fail fast on a malformed replacement).
watch(() => props.config, config => validateConfig(config))

// The store mutates the v-model ref in place, then reassigns a fresh top-level
// object so `update:data` is emitted on every change. External replacement of
// `data` is read back through the same ref for free.
// TODO: deep-immutable updates (new objects for every touched node) for undo/
// redo and snapshot propagation are still future work — tracked as variant A.
const store = createEditorStore(() => props.config, modelData)
provideEditorStore(store)
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
