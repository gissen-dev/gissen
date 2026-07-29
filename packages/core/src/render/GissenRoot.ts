import type { Component, PropType, VNode, VNodeChild } from 'vue'
import { defineComponent, h } from 'vue'

/**
 * Internal root-wrapper seam shared by the editor canvas and `GissenRender`:
 * renders its default slot inside `config.root.render` (passing
 * `data.root.props`), or bare — no extra element — when no root render is
 * configured. Both paths delegating here is what keeps the editor WYSIWYG for
 * root rendering.
 */
export default defineComponent({
  name: 'GissenRoot',

  // Renders either the configured root component or a bare fragment — there
  // is no element of our own for fallthrough attrs to land on.
  inheritAttrs: false,

  props: {
    /** `config.root.render`; when absent the slot content renders bare. */
    render: {
      type: [Object, Function] as PropType<Component>,
      default: undefined,
    },
    /** `data.root.props`, passed to the root component as props. */
    rootProps: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
  },

  setup(props, { slots }) {
    const content = (): VNode[] => slots.default?.() ?? []
    return (): VNodeChild =>
      props.render === undefined
        ? content()
        : h(props.render, props.rootProps, { default: content })
  },
})
