import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { describe, expect, it } from 'vitest'
import { h, ref } from 'vue'
import { createEditorStore } from '../../src/composables/useEditorStore'
import { VIEWPORT_WIDTHS, viewportScale, viewportWidth } from '../../src/utils/viewport'

const Stub: Component = () => h('div')

const config: GissenConfig = {
  components: {
    Hero: {
      fields: { title: { type: 'text' } },
      defaultProps: { title: 'Hello' },
      render: Stub,
    },
  },
}

function emptyData(): GissenData {
  return { version: 1, root: { props: {} }, content: [] }
}

describe('viewport helpers', () => {
  it('maps presets to their fixed frame widths', () => {
    expect(viewportWidth('desktop')).toBeNull()
    expect(viewportWidth('tablet')).toBe(VIEWPORT_WIDTHS.tablet)
    expect(viewportWidth('mobile')).toBe(VIEWPORT_WIDTHS.mobile)
    expect(VIEWPORT_WIDTHS).toEqual({ tablet: 768, mobile: 375 })
  })

  it('scales only when the pane cannot hold the preset', () => {
    expect(viewportScale(null, 1200, false)).toBe(1) // desktop: unconstrained
    expect(viewportScale(768, 1200, false)).toBe(1) // fits
    expect(viewportScale(768, 768, false)).toBe(1) // exact fit
    expect(viewportScale(768, 384, false)).toBe(0.5) // too narrow: shrink
  })

  it('stays at 1 while the pane is unmeasured or empty', () => {
    expect(viewportScale(768, null, false)).toBe(1)
    expect(viewportScale(768, 0, false)).toBe(1)
  })

  it('resets to 1 during an active drag (Sortable hit-tests unscaled)', () => {
    expect(viewportScale(768, 384, true)).toBe(1)
  })
})

describe('viewport store state', () => {
  it('defaults to desktop and switches via setViewport', () => {
    const store = createEditorStore(config, emptyData())
    expect(store.viewport).toBe('desktop')
    store.setViewport('mobile')
    expect(store.viewport).toBe('mobile')
    store.setViewport('desktop')
    expect(store.viewport).toBe('desktop')
  })

  it('is per-instance: two editors never share a viewport', () => {
    const a = createEditorStore(config, emptyData())
    const b = createEditorStore(config, emptyData())
    a.setViewport('tablet')
    expect(a.viewport).toBe('tablet')
    expect(b.viewport).toBe('desktop')
  })

  it('is orthogonal to history: undo/redo never change it', () => {
    const store = createEditorStore(config, emptyData())
    store.insertComponent('Hero', null, null, 0)
    store.setViewport('tablet')
    store.undo()
    expect(store.viewport).toBe('tablet')
    expect(store.data.content).toHaveLength(0)
    store.redo()
    expect(store.viewport).toBe('tablet')
  })

  it('never appears in the emitted GissenData', () => {
    const dataRef = ref<GissenData>(emptyData())
    const store = createEditorStore(config, dataRef)
    store.setViewport('mobile')
    store.insertComponent('Hero', null, null, 0)
    store.undo()
    store.redo()

    const emitted = dataRef.value
    expect(Object.keys(emitted).sort()).toEqual(['content', 'root', 'version'])
    expect(JSON.stringify(emitted)).not.toContain('viewport')
  })

  it('drag flag defaults to false and toggles via setDragging', () => {
    const store = createEditorStore(config, emptyData())
    expect(store.dragging).toBe(false)
    store.setDragging(true)
    expect(store.dragging).toBe(true)
    store.setDragging(false)
    expect(store.dragging).toBe(false)
  })
})
