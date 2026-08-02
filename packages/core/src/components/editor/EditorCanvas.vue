<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'
import { useCanvasZoneDnD } from '../../composables/useGissenDnD'
import { useSelection } from '../../composables/useSelection'
import GissenRoot from '../../render/GissenRoot'
import { viewportScale, viewportWidth } from '../../utils/viewport'
import CanvasNode from './CanvasNode.vue'

const store = useEditorStore()

// `rootEl` is focusable (tabindex="0"): clicking anywhere on the canvas — or
// tabbing to it — focuses it, scoping keyboard shortcuts (delete, undo/redo)
// to this editor instance without requiring a mouse.
const rootEl = ref<HTMLElement | null>(null)
useSelection(rootEl)

// The canvas zone lives inside GissenRoot's default slot, so a `root.render`
// component that never renders that slot leaves `innerEl` null — the DnD
// layer skips init for it (dev error below) instead of crashing the app.
const innerEl = ref<HTMLElement | null>(null)
useCanvasZoneDnD(innerEl, () => ({ parentId: null, slotName: null }), {
  missingElementMessage:
    '[Gissen] The canvas drop zone never mounted, so drag-and-drop is disabled '
    + 'for this editor. Does your `root.render` component render its default '
    + 'slot? The editor canvas mounts inside it — add `<slot />` to the root '
    + 'component.',
})

// Viewport preview measurements for scale-to-fit: the pane width decides
// whether the preset even fits, the frame height sizes the scroll-extent
// compensation. Only real browsers have ResizeObserver; without it (SSR,
// jsdom) both stay null and the scale stays 1 — the width constraint alone
// still applies.
const frameEl = ref<HTMLElement | null>(null)
const paneWidth = ref<number | null>(null)
const frameHeight = ref<number | null>(null)

let observer: ResizeObserver | null = null
onMounted(() => {
  if (typeof ResizeObserver === 'undefined' || rootEl.value === null || frameEl.value === null)
    return
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === rootEl.value)
        paneWidth.value = entry.contentRect.width
      else
        frameHeight.value = entry.contentRect.height
    }
  })
  observer.observe(rootEl.value)
  observer.observe(frameEl.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const width = computed(() => viewportWidth(store.viewport))
// An active drag forces scale 1 (Sortable hit-tests in untransformed
// coordinates); the width constraint stays, so drops land in the real layout.
const scale = computed(() => viewportScale(width.value, paneWidth.value, store.dragging))

const frameStyle = computed(() => {
  if (width.value === null)
    return undefined
  const style: Record<string, string> = { width: `${width.value}px` }
  if (scale.value < 1) {
    style.transform = `scale(${scale.value})`
    style.transformOrigin = 'top center'
    // transform does not affect layout: pull the flow up by the shrunk amount
    // so the scroll extent matches what is actually visible.
    if (frameHeight.value !== null)
      style.marginBottom = `${Math.round((scale.value - 1) * frameHeight.value)}px`
  }
  return style
})
</script>

<template>
  <main
    ref="rootEl"
    class="gissen-canvas"
    :class="{ 'gissen-canvas--framed': width !== null }"
    tabindex="0"
    aria-label="Page canvas"
  >
    <div ref="frameEl" class="gissen-canvas__viewport" :style="frameStyle">
      <!--
        The root wrapper sits between the viewport frame and the DnD zone:
        `.gissen-canvas__inner` must stay the direct parent of the CanvasNodes
        (Sortable hit-tests the zone's direct children), and the frame stays
        the size container for the viewport preview.
      -->
      <GissenRoot :render="store.config.root?.render" :root-props="store.data.root.props">
        <div ref="innerEl" class="gissen-canvas__inner">
          <div v-if="store.data.content.length === 0" class="gissen-canvas__empty">
            <p class="gissen-canvas__empty-title">
              Canvas is empty
            </p>
            <p class="gissen-canvas__empty-hint">
              Drag components from the sidebar to get started
            </p>
          </div>
          <template v-else>
            <CanvasNode
              v-for="component in store.data.content"
              :key="component.props.id"
              :component="component"
            />
          </template>
        </div>
      </GissenRoot>
    </div>
  </main>
</template>
