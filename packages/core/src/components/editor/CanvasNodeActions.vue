<script setup lang="ts">
import { useEditorStore } from '../../composables/useEditorStore'

const props = defineProps<{ componentId: string }>()

const store = useEditorStore()

function onDelete(event: Event): void {
  // Hand focus to the canvas root before the node (and this button with it)
  // unmounts: focus must not be left on a removed element, and the undo
  // shortcut should work immediately after a mouse delete.
  const canvas = (event.currentTarget as HTMLElement).closest<HTMLElement>('.gissen-canvas')
  store.removeComponent(props.componentId)
  canvas?.focus()
}
</script>

<template>
  <!-- Editor chrome layered over the selected node: absolutely positioned, so
       it never affects document layout and never appears in emitted data.
       Clicks stay inside — bubbling to the node wrapper would re-select the
       node this toolbar is about to act on. Built to hold more actions later
       (duplicate/copy); v0.1 ships delete only. -->
  <div class="gissen-node-actions" @click.stop @pointerdown.stop>
    <button
      type="button"
      class="gissen-node-actions__button"
      aria-label="Delete component"
      title="Delete component (Del)"
      @click="onDelete"
    >
      <svg class="gissen-node-actions__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2.5 4h11M6.5 4V2.75A.75.75 0 0 1 7.25 2h1.5a.75.75 0 0 1 .75.75V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M4 4l.7 9.05a1 1 0 0 0 1 .95h4.6a1 1 0 0 0 1-.95L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M6.5 7v4M9.5 7v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>
