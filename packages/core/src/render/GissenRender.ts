import type { PropType, VNode, VNodeChild } from 'vue'
import type { ComponentData, GissenConfig, GissenData } from '../types'
import { defineComponent, h } from 'vue'
import GissenRoot from './GissenRoot'
import { resolveNode } from './resolve'

/**
 * Renders one node of the page tree: the user component with its props, its
 * slot children rendered recursively into named slots. Returns `null` for
 * unknown component types — the caller drops the node and the rest of the
 * tree renders.
 */
function renderNode(config: GissenConfig, node: ComponentData): VNode | null {
  const { config: componentConfig, props, slots } = resolveNode(config, node)

  if (componentConfig === undefined) {
    if (__DEV__) {
      console.warn(
        `[Gissen] <GissenRender> skipped a node of unknown type "${node.type}" `
        + `(id: "${node.props.id}") — not registered in config.components.`,
      )
    }
    return null
  }

  // Children go into the named slot matching the slot field, the convention
  // user components already rely on in the editor: `<slot :name="fieldName">`.
  const slotMap: Record<string, () => VNode[]> = {}
  for (const [slotName, children] of Object.entries(slots)) {
    slotMap[slotName] = () => renderChildren(config, children)
  }

  // Keyed by the node's stable id so reordering data moves DOM instead of
  // re-creating it (live-preview edits reconcile in place).
  return h(componentConfig.render, { ...props, key: node.props.id }, slotMap)
}

/** Renders a sibling list, dropping the nodes that resolve to nothing. */
function renderChildren(config: GissenConfig, children: ComponentData[]): VNode[] {
  const rendered: VNode[] = []
  for (const child of children) {
    const vnode = renderNode(config, child)
    if (vnode !== null)
      rendered.push(vnode)
  }
  return rendered
}

/**
 * The production renderer: takes the same `config` the editor takes and the
 * `GissenData` document the editor produced, and renders the page with the
 * user components alone.
 *
 * ```vue
 * <GissenRender :config="config" :data="data" />
 * ```
 *
 * **Zero wrapper elements.** Unlike the editor canvas, which wraps every node
 * in editor chrome, `GissenRender` emits only the user components' own DOM,
 * as Vue fragments at every nesting level. There is consequently no element
 * to inherit fallthrough attrs — a `class` on `<GissenRender>` goes nowhere
 * by design; put it on `config.root.render` or a surrounding element instead.
 *
 * **Root rendering.** When `config.root.render` is set, the page content
 * renders inside it via its default slot, with `data.root.props` as props —
 * the same wrapper the editor canvas shows. Without it, content renders as a
 * bare fragment.
 *
 * **Resilient by policy.** Bad data must not take down the host page:
 * unknown component types are skipped (dev-only console warning, silent in
 * production) while the rest of the tree renders; absent props are passed
 * as-is (`undefined`) — components own their defaults; the envelope
 * `version` is ignored. No document validation runs here — rendering is
 * best-effort. Hosts that want strictness call `validateData(data, config)`
 * themselves before rendering.
 *
 * **Reactive.** Prop changes re-render. Binding the same ref the editor
 * mutates gives a live preview:
 *
 * ```vue
 * <GissenEditor v-model:data="doc" :config="config" />
 * <GissenRender :data="doc" :config="config" />
 * ```
 *
 * **SSR-safe.** No browser APIs at render time, and output is a pure
 * function of `(config, data)` — safe to render on the server and hydrate.
 */
export default defineComponent({
  name: 'GissenRender',

  // Fragment-rooted on purpose (zero wrappers): nowhere for attrs to land.
  inheritAttrs: false,

  props: {
    /** The Gissen configuration — the same object `GissenEditor` takes. */
    config: {
      type: Object as PropType<GissenConfig>,
      required: true,
    },
    /** The document to render, as produced by the editor. */
    data: {
      type: Object as PropType<GissenData>,
      required: true,
    },
  },

  setup(props) {
    return (): VNodeChild =>
      h(
        GissenRoot,
        { render: props.config.root?.render, rootProps: props.data.root.props },
        { default: () => renderChildren(props.config, props.data.content) },
      )
  },
})
