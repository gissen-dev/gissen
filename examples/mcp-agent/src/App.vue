<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor } from 'gissen'
import { GissenRender } from 'gissen/render'
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import config from '../gissen.config'
import { data } from './page-store'

// Two views over one page.json, as in the live demo this example comes from:
// `#/` is the editor, `#/render` the rendered page. A hash is enough here and
// keeps the example free of a router dependency.
type View = 'editor' | 'render'

function viewFromHash(): View {
  return window.location.hash === '#/render' ? 'render' : 'editor'
}

const view = ref<View>(viewFromHash())
const syncView = (): void => {
  view.value = viewFromHash()
}
onMounted(() => window.addEventListener('hashchange', syncView))
onBeforeUnmount(() => window.removeEventListener('hashchange', syncView))

// The editor works on a copy: its changes stay in memory and are never written
// back to page.json. When the agent rewrites the file, the copy is replaced,
// so the editor shows the agent's version too (and starts a fresh undo
// history, as the editor does for any document swapped in from outside).
const editorData = ref<GissenData>(structuredClone(toRaw(data.value)))
watch(data, (next) => {
  editorData.value = structuredClone(toRaw(next))
})
</script>

<template>
  <div class="app-shell">
    <nav class="app-nav">
      <a href="#/" :class="{ active: view === 'editor' }">Editor</a>
      <a href="#/render" :class="{ active: view === 'render' }">Rendered page</a>
    </nav>
    <div class="app-page">
      <GissenEditor v-if="view === 'editor'" v-model:data="editorData" :config="config" style="height: 100%;" />
      <GissenRender v-else :config="config" :data="data" />
    </div>
  </div>
</template>

<style>
* { box-sizing: border-box; }
body { margin: 0; }

.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-nav {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-family: system-ui, sans-serif;
  font-size: 0.875rem;
}

.app-nav a {
  color: #374151;
  text-decoration: none;
}

.app-nav a.active {
  color: #111827;
  font-weight: 600;
}

.app-page {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
