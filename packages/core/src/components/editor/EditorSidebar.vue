<script setup lang="ts">
import type { GissenConfig } from '../../types'
import { computed, nextTick, ref, watch } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'
import { useSidebarDnD } from '../../composables/useGissenDnD'

const props = defineProps<{ config: GissenConfig }>()
const store = useEditorStore()

// Computed so a swapped `config` prop updates the palette.
const componentTypes = computed(() => Object.keys(props.config.components))

const listEl = ref<HTMLElement | null>(null)
const focusedIndex = ref(0)

useSidebarDnD(listEl)

watch(componentTypes, (types) => {
  focusedIndex.value = Math.min(focusedIndex.value, Math.max(types.length - 1, 0))
})

function getPaletteItems(): HTMLElement[] {
  return Array.from(listEl.value?.querySelectorAll<HTMLElement>('.gissen-sidebar__item') ?? [])
}

function clampIndex(index: number): number {
  return Math.min(Math.max(index, 0), componentTypes.value.length - 1)
}

function focusItem(index: number): void {
  if (componentTypes.value.length === 0)
    return

  focusedIndex.value = clampIndex(index)
  void nextTick(() => {
    getPaletteItems()[focusedIndex.value]?.focus()
  })
}

function addComponent(type: string): void {
  store.insertComponent(type, null, null, store.data.content.length)
}

function onItemKeydown(event: KeyboardEvent, type: string, index: number): void {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      focusItem(index + 1)
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      focusItem(index - 1)
      break
    case 'Home':
      event.preventDefault()
      focusItem(0)
      break
    case 'End':
      event.preventDefault()
      focusItem(componentTypes.value.length - 1)
      break
    case 'Enter':
      event.preventDefault()
      addComponent(type)
      break
  }
}
</script>

<template>
  <aside class="gissen-sidebar">
    <div class="gissen-sidebar__header">
      Components
    </div>
    <ul ref="listEl" class="gissen-sidebar__list" role="listbox" aria-label="Component palette">
      <li
        v-for="(type, index) in componentTypes"
        :key="type"
        class="gissen-sidebar__item"
        role="option"
        :data-gissen-type="type"
        :tabindex="index === focusedIndex ? 0 : -1"
        :aria-label="`Add ${type} component to canvas`"
        :aria-selected="index === focusedIndex"
        aria-keyshortcuts="Enter"
        @focus="focusedIndex = index"
        @keydown="onItemKeydown($event, type, index)"
      >
        <svg class="gissen-sidebar__item-icon" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5" />
        </svg>
        {{ type }}
      </li>
    </ul>
  </aside>
</template>
