import type { Component } from 'vue'
import type { GissenConfig, GissenData, NumberField } from '../../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import NumberInput from '../../src/components/editor/fields/NumberInput.vue'
import { createEditorStore, provideEditorStore } from '../../src/composables/useEditorStore'

const Stub: Component = () => h('div')

function makeConfig(field: NumberField): GissenConfig {
  return {
    components: {
      Box: { fields: { size: field }, render: Stub },
    },
  }
}

function makeData(size: number): GissenData {
  return { version: 1, root: { props: {} }, content: [{ type: 'Box', props: { id: 'box-1', size } }] }
}

/**
 * Mounts a NumberInput bound to `box-1.size`, returning the wrapper, store, and
 * the <input> element. The field's constraints are supplied per-test.
 */
function mountNumberInput(field: NumberField, initial: number) {
  const store = createEditorStore(makeConfig(field), makeData(initial))
  const Wrapper = defineComponent({
    setup() { provideEditorStore(store) },
    render() {
      return h(NumberInput, { componentId: 'box-1', name: 'size', inputId: 'in', field })
    },
  })
  const wrapper = mount(Wrapper, { attachTo: document.body })
  const input = wrapper.find('input')
  const size = (): unknown => store.data.content[0].props.size
  return { wrapper, store, input, size }
}

describe('numberInput — min/max/step enforcement (H-2)', () => {
  it('clamps a value above max on blur', async () => {
    const { input, size } = mountNumberInput({ type: 'number', max: 100 }, 10)
    await input.setValue('500')
    await input.trigger('blur')
    expect(size()).toBe(100)
    expect((input.element as HTMLInputElement).value).toBe('100')
  })

  it('clamps a value below min on blur', async () => {
    const { input, size } = mountNumberInput({ type: 'number', min: 0 }, 10)
    await input.setValue('-5')
    await input.trigger('blur')
    expect(size()).toBe(0)
    expect((input.element as HTMLInputElement).value).toBe('0')
  })

  it('snaps to the nearest step on blur (anchored at min)', async () => {
    const { input, size } = mountNumberInput({ type: 'number', min: 0, step: 5 }, 0)
    await input.setValue('12')
    await input.trigger('blur')
    expect(size()).toBe(10)
  })

  it('snaps a fractional step without floating-point drift', async () => {
    const { input, size } = mountNumberInput({ type: 'number', min: 0, step: 0.1 }, 0)
    await input.setValue('0.30000001')
    await input.trigger('blur')
    expect(size()).toBe(0.3)
  })

  it('leaves an in-range, on-grid value unchanged on blur', async () => {
    const { input, size } = mountNumberInput({ type: 'number', min: 0, max: 100, step: 5 }, 0)
    await input.setValue('25')
    await input.trigger('blur')
    expect(size()).toBe(25)
  })

  it('keeps the model at its last valid value while the draft is out-of-range', async () => {
    // An over-max draft behaves like an unparseable intermediate: the draft
    // shows what was typed, but the model never holds an out-of-range number —
    // every `update:data` snapshot stays valid. Blur normalizes.
    const { input, size } = mountNumberInput({ type: 'number', max: 50 }, 0)
    await input.setValue('500')
    expect(size()).toBe(0)
    expect((input.element as HTMLInputElement).value).toBe('500')
    await input.trigger('blur')
    expect(size()).toBe(50)
    expect((input.element as HTMLInputElement).value).toBe('50')
  })

  it('does not clamp mid-typing: a below-min intermediate stays pending until completed', async () => {
    // Typing "50" under min: 10 passes through "5"; clamping "5" to 10 would
    // fight the keystroke. The model waits until the draft is in range.
    const { input, size } = mountNumberInput({ type: 'number', min: 10 }, 20)
    await input.setValue('5')
    expect(size()).toBe(20)
    expect((input.element as HTMLInputElement).value).toBe('5')
    await input.setValue('50')
    expect(size()).toBe(50)
  })

  it('leaves a non-parseable draft untouched on blur (model keeps prior value)', async () => {
    const { input, size } = mountNumberInput({ type: 'number', min: 0, max: 100 }, 42)
    await input.setValue('abc')
    await input.trigger('blur')
    // Garbage draft persists, model is unchanged (existing draft rules).
    expect(size()).toBe(42)
  })
})

describe('numberInput — draft state machine (H-4)', () => {
  function el(input: ReturnType<typeof mountNumberInput>['input']): HTMLInputElement {
    return input.element as HTMLInputElement
  }

  it('types "1" → "1." → "1.5" without resetting the draft or thrashing the model', async () => {
    const { input, size } = mountNumberInput({ type: 'number' }, 0)

    await input.setValue('1')
    expect(size()).toBe(1)
    expect(el(input).value).toBe('1')

    // "1." is an intermediate: it parses to 1, so the model must not change and
    // the draft must keep the trailing dot (no re-seed, no caret jump).
    await input.setValue('1.')
    expect(size()).toBe(1)
    expect(el(input).value).toBe('1.')

    await input.setValue('1.5')
    expect(size()).toBe(1.5)
    expect(el(input).value).toBe('1.5')
  })

  it('leaves the model untouched while a lone "-" is typed, then commits the negative', async () => {
    const { input, size } = mountNumberInput({ type: 'number' }, 7)

    await input.setValue('-')
    // "-" is not a finite number — model stays at its prior value.
    expect(size()).toBe(7)
    expect(el(input).value).toBe('-')

    await input.setValue('-5')
    expect(size()).toBe(-5)
  })

  it('clears to undefined, never 0', async () => {
    const { input, size } = mountNumberInput({ type: 'number' }, 5)
    await input.setValue('')
    expect(size()).toBeUndefined()
    expect(size()).not.toBe(0)
  })

  it('never corrupts the model when garbage is pasted', async () => {
    const { input, size } = mountNumberInput({ type: 'number' }, 3)
    await input.setValue('not a number')
    expect(size()).toBe(3)
    expect(el(input).value).toBe('not a number')
  })

  it('re-seeds the draft when the model value changes externally', async () => {
    const { input, store } = mountNumberInput({ type: 'number' }, 1)
    expect(el(input).value).toBe('1')
    // An external edit to the same node's prop must re-seed the visible draft.
    store.updateProp('box-1', 'size', 99)
    await nextTick()
    expect(el(input).value).toBe('99')
  })
})
