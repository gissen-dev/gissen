<script lang="ts">
import type { PropType, VNode } from 'vue'
import type { ComponentData } from '../../types'
/**
 * CanvasNode wraps each component instance on the canvas.
 * Uses a render function (not a template) so that slot names can be
 * dynamically derived from config at runtime — Vue template #[name] syntax
 * does not support v-for-derived dynamic slot names reliably.
 *
 * Each user component that has a slot field declares:
 *   <slot :name="fieldName" />
 * in its template. CanvasNode passes a CanvasSlot into each of those named
 * slots, providing the recursive editor tree.
 *
 * NOTE: This component introduces one wrapper <div class="gissen-node"> per
 * component instance in editor mode only. Production rendering via
 * <GissenRender> has zero wrappers.
 */
import { computed, defineAsyncComponent, defineComponent, h } from 'vue'
import { useEditorStore } from '../../composables/useEditorStore'
import { resolveNode } from '../../render/resolve'
import CanvasNodeActions from './CanvasNodeActions.vue'

// Lazy import to break the CanvasNode ↔ CanvasSlot circular dependency
const CanvasSlot = defineAsyncComponent(() => import('./CanvasSlot.vue'))

export default defineComponent({
  name: 'CanvasNode',

  props: {
    component: {
      type: Object as PropType<ComponentData>,
      required: true,
    },
  },

  setup(props) {
    const store = useEditorStore()

    // Shared resolution seam with GissenRender: config lookup, props/slot
    // split. Only the DOM around the resolved component is editor-specific.
    const resolved = computed(() => resolveNode(store.config, props.component))

    return (): VNode => {
      const id = props.component.props.id
      const isSelected = store.selectedId === id

      const handleClick = (e: Event): void => {
        e.stopPropagation()
        store.selectComponent(id)
      }

      const { config: componentConfig, props: componentProps, slots } = resolved.value

      let inner: VNode
      if (!componentConfig) {
        inner = h('div', { class: 'gissen-node--error' }, `Unknown component: ${props.component.type}`)
      }
      else {
        const slotMap: Record<string, () => VNode[]> = {}
        for (const [slotName, children] of Object.entries(slots)) {
          slotMap[slotName] = () => [h(CanvasSlot, { parentId: id, slotName, children })]
        }
        inner = h(componentConfig.render, componentProps, slotMap)
      }

      return h(
        'div',
        {
          'class': { 'gissen-node': true, 'gissen-node--selected': isSelected },
          'data-gissen-id': id,
          'onClick': handleClick,
        },
        // The floating node-action toolbar rides on the selected node only —
        // editor chrome, absolutely positioned, unmounts with the selection.
        isSelected ? [inner, h(CanvasNodeActions, { componentId: id })] : [inner],
      )
    }
  },
})
</script>
