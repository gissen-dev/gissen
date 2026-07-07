<script setup lang="ts">
import { ToolbarButton, ToolbarRoot, ToolbarSeparator, ToolbarToggleGroup, ToolbarToggleItem } from 'reka-ui'
import { computed, onMounted, ref } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'
import { isApplePlatform } from '../../utils/platform'

const store = useEditorStore()

// Resolved after mount so SSR deterministically renders the Ctrl labels;
// Apple clients patch to ⌘ post-hydration without a mismatch.
const apple = ref(false)
onMounted(() => {
  apple.value = isApplePlatform()
})

const undoTitle = computed(() => (apple.value ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'))
const redoTitle = computed(() => (apple.value ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Shift+Z)'))

// Reka's single-toggle group emits an empty value when the active item is
// clicked again, but a viewport must always be selected — narrowing to the
// three presets also drops that deselection.
function onViewportChange(value: unknown): void {
  if (value === 'desktop' || value === 'tablet' || value === 'mobile')
    store.setViewport(value)
}
</script>

<template>
  <ToolbarRoot class="gissen-toolbar" aria-label="Editor toolbar">
    <ToolbarButton
      class="gissen-toolbar__button"
      :disabled="!store.canUndo"
      :title="undoTitle"
      aria-label="Undo"
      @click="store.undo()"
    >
      <svg class="gissen-toolbar__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6.5 3.5 3 7l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M3 7h6.5a3 3 0 0 1 0 6H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </ToolbarButton>
    <ToolbarButton
      class="gissen-toolbar__button"
      :disabled="!store.canRedo"
      :title="redoTitle"
      aria-label="Redo"
      @click="store.redo()"
    >
      <svg class="gissen-toolbar__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M9.5 3.5 13 7l-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M13 7H6.5a3 3 0 0 0 0 6H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </ToolbarButton>

    <ToolbarSeparator class="gissen-toolbar__separator" />

    <ToolbarToggleGroup
      type="single"
      class="gissen-toolbar__viewports"
      :model-value="store.viewport"
      aria-label="Preview viewport"
      @update:model-value="onViewportChange"
    >
      <ToolbarToggleItem
        value="desktop"
        class="gissen-toolbar__toggle"
        title="Desktop preview"
        aria-label="Desktop preview"
      >
        <svg class="gissen-toolbar__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="3" width="13" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M8 11.5V14M5.5 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </ToolbarToggleItem>
      <ToolbarToggleItem
        value="tablet"
        class="gissen-toolbar__toggle"
        title="Tablet preview (768px)"
        aria-label="Tablet preview"
      >
        <svg class="gissen-toolbar__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M7 11.75h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </ToolbarToggleItem>
      <ToolbarToggleItem
        value="mobile"
        class="gissen-toolbar__toggle"
        title="Mobile preview (375px)"
        aria-label="Mobile preview"
      >
        <svg class="gissen-toolbar__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M7.25 12.25h1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
  </ToolbarRoot>
</template>
