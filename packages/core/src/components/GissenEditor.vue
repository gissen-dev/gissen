<script setup lang="ts">
import type { GissenConfig, GissenData } from '../types'
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

// The store mutates the v-model ref directly — single source of truth, so
// edits propagate to the parent and external replacement is read back for
// free, with no sync watchers.
// TODO: replace in-place mutation with immutable updates (new `data` object
// per change) so v-model emits a fresh reference, enabling undo/redo and
// snapshot-based propagation. Tracked separately as variant A.
const store = createEditorStore(props.config, modelData)
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
