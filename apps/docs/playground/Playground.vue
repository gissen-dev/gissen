<script setup lang="ts">
import type { GissenData } from 'gissen'
import { GissenEditor, GissenRender } from 'gissen'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import config from './config'
import { samplePage } from './sample-page'
import 'gissen/style.css'

type Tab = 'editor' | 'preview' | 'json'

const tabs: { id: Tab, label: string }[] = [
  { id: 'editor', label: 'Editor' },
  { id: 'preview', label: 'Preview' },
  { id: 'json', label: 'JSON' },
]

// In-memory only: nothing is saved, and a reload starts from the sample.
const data = ref<GissenData>(samplePage())
const tab = ref<Tab>('editor')
const narrow = ref(false)
const copied = ref(false)

const json = computed(() => JSON.stringify(data.value, null, 2))

let copiedTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  // The editor's sidebar and panel need about 960px, so on a phone the first
  // thing shown is the preview, which works at any width. The editor is still
  // one tap away, in a frame that scrolls sideways.
  narrow.value = window.matchMedia('(max-width: 768px)').matches
  if (narrow.value)
    tab.value = 'preview'
})

onBeforeUnmount(() => clearTimeout(copiedTimer))

function reset(): void {
  // The editor resets its undo history when the bound document is replaced
  // from outside, so there is nothing to undo back into after this.
  data.value = samplePage()
}

function fallbackCopy(text: string): void {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.appendChild(field)
  field.select()
  document.execCommand('copy')
  field.remove()
}

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(json.value)
  }
  catch {
    // No Clipboard API (insecure context, older browser): use the old route.
    fallbackCopy(json.value)
  }
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1500)
}

function onTabKeydown(event: KeyboardEvent): void {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (step === 0)
    return
  event.preventDefault()
  const next = (tabs.findIndex(candidate => candidate.id === tab.value) + step + tabs.length) % tabs.length
  tab.value = tabs[next].id
  document.getElementById(`pg-tab-${tabs[next].id}`)?.focus()
}
</script>

<template>
  <div class="playground">
    <div class="playground__bar">
      <div class="playground__tabs" role="tablist" aria-label="Playground view" @keydown="onTabKeydown">
        <button
          v-for="candidate in tabs"
          :id="`pg-tab-${candidate.id}`"
          :key="candidate.id"
          type="button"
          role="tab"
          :aria-selected="tab === candidate.id"
          :aria-controls="`pg-panel-${candidate.id}`"
          :tabindex="tab === candidate.id ? 0 : -1"
          class="playground__tab"
          @click="tab = candidate.id"
        >
          {{ candidate.label }}
        </button>
      </div>
      <div class="playground__actions">
        <button type="button" class="playground__action" @click="reset">
          Reset
        </button>
        <button type="button" class="playground__action" @click="copy">
          {{ copied ? 'Copied' : 'Copy JSON' }}
        </button>
      </div>
    </div>

    <p v-if="narrow && tab === 'editor'" class="playground__note">
      The editor is built for a wide screen. Scroll sideways to reach every panel, or use Preview.
    </p>

    <!-- v-show, not v-if: the editor keeps its undo history while you look at the other tabs. -->
    <div
      v-show="tab === 'editor'"
      id="pg-panel-editor"
      class="playground__panel playground__scroll"
      role="tabpanel"
      aria-labelledby="pg-tab-editor"
    >
      <div class="playground__editor">
        <GissenEditor v-model:data="data" :config="config" style="height: 100%;" />
      </div>
    </div>

    <div
      v-if="tab === 'preview'"
      id="pg-panel-preview"
      class="playground__panel playground__surface"
      role="tabpanel"
      aria-labelledby="pg-tab-preview"
    >
      <GissenRender :config="config" :data="data" />
    </div>

    <div
      v-if="tab === 'json'"
      id="pg-panel-json"
      class="playground__panel"
      role="tabpanel"
      aria-labelledby="pg-tab-json"
    >
      <pre class="playground__json"><code>{{ json }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.playground {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.playground__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.playground__tabs,
.playground__actions {
  display: flex;
  gap: 8px;
}

.playground__tab,
.playground__action {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  padding: 6px 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.playground__tab:hover,
.playground__action:hover {
  border-color: var(--vp-c-brand-1);
}

/* brand-3 is the button color in both themes: white text stays readable. */
.playground__tab[aria-selected='true'] {
  background: var(--vp-c-brand-3);
  border-color: var(--vp-c-brand-3);
  color: #fff;
}

.playground__note {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.playground__panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

/* The editor chrome is light, so the surfaces around it stay light in the
   site's dark mode too: one consistent canvas, not a half-inverted one. */
.playground__surface {
  background: #fff;
  color: #1e293b;
  color-scheme: light;
  min-height: 320px;
}

.playground__scroll {
  overflow-x: auto;
  background: #fff;
  color-scheme: light;
}

.playground__editor {
  height: 640px;
  min-width: 960px;
}

.playground__json {
  margin: 0;
  max-height: 640px;
  overflow: auto;
  padding: 16px;
  background: var(--vp-code-block-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  line-height: 1.5;
}
</style>
