import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import GissenEditor from '../../src/components/GissenEditor.vue'
import { GissenValidationError } from '../../src/validation'

// GissenEditor renders the canvas/sidebar which wire up vue-draggable-plus.
vi.mock('vue-draggable-plus', () => ({
  useDraggable: vi.fn(() => ({ start: vi.fn(), pause: vi.fn(), resume: vi.fn() })),
}))

const Stub: Component = () => h('div')

const config: GissenConfig = {
  components: {
    Hero: { fields: { title: { type: 'text' } }, defaultProps: { title: 'Hi' }, render: Stub },
  },
}

function validData(): GissenData {
  return { root: { props: {} }, content: [{ type: 'Hero', props: { id: 'h1', title: 'Hi' } }] }
}

describe('gissenEditor', () => {
  it('mounts with valid config and data', () => {
    expect(() => mount(GissenEditor, { props: { config, data: validData() } })).not.toThrow()
  })

  it('throws GissenValidationError when data is missing content', () => {
    expect(() =>
      mount(GissenEditor, { props: { config, data: { root: { props: {} } } as never } }),
    ).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when a node prop mismatches the config', () => {
    const bad = {
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'h1', title: 123 } }],
    } as never
    expect(() => mount(GissenEditor, { props: { config, data: bad } })).toThrow(GissenValidationError)
  })

  it('throws GissenValidationError when the config is malformed', () => {
    expect(() =>
      mount(GissenEditor, { props: { config: {} as never, data: validData() } }),
    ).toThrow(GissenValidationError)
  })
})
