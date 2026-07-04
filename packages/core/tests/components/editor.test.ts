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
  return { version: 1, root: { props: {} }, content: [{ type: 'Hero', props: { id: 'h1', title: 'Hi' } }] }
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

  it('round-trips a properties-panel edit through update:data', async () => {
    const wrapper = mount(GissenEditor, { props: { config, data: validData() } })

    // Select the node on the canvas, then edit its title in the panel.
    await wrapper.find('[data-gissen-id="h1"]').trigger('click')
    const input = wrapper.find('.gissen-panel input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('Hi')

    await input.setValue('Edited via panel')

    const emissions = wrapper.emitted('update:data')
    expect(emissions).toBeTruthy()
    const latest = emissions!.at(-1)![0] as GissenData
    expect(latest.content[0].props.title).toBe('Edited via panel')
    // The envelope's version survives the round-trip.
    expect(latest.version).toBe(1)
  })

  it('mounts a hand-written document that omits a slot key and normalizes it for editing', () => {
    // A user component that renders its named slot, so the canvas injects the
    // CanvasSlot drop zone for it (drop-zone DOM itself is covered by
    // canvas.test.ts — CanvasSlot is async and slow to resolve in jsdom).
    const SlotStub: Component = (_, { slots }) => h('div', slots.children?.())
    const slotConfig: GissenConfig = {
      components: {
        ...config.components,
        Container: { fields: { children: { type: 'slot' } }, render: SlotStub },
      },
    }
    // Hand-authored: the `children` slot key is omitted entirely. Absent props
    // validate at mount, and acceptance-time normalization initializes the
    // slot to [] in place so it is immediately droppable.
    const data: GissenData = {
      version: 1,
      root: { props: {} },
      content: [{ type: 'Container', props: { id: 'c1' } }],
    }
    expect(() => mount(GissenEditor, { props: { config: slotConfig, data } })).not.toThrow()
    expect(data.content[0].props.children).toEqual([])
  })
})
