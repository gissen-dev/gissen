/**
 * A single component instance in the page tree.
 *
 * Slot fields contain `ComponentData[]` arrays directly in `props`, which makes
 * the structure recursive: a component's slot prop holds its child components.
 */
export interface ComponentData<TProps = Record<string, unknown>> {
  /** The component type name; must match a key in `GissenConfig.components`. */
  type: string
  /** The component's props. Slot fields are `ComponentData[]` arrays nested here. */
  props: TProps & { id: string }
}

/**
 * The root container of the page. Its props are configured separately via
 * `GissenConfig.root`.
 */
export interface RootData<TProps = Record<string, unknown>> {
  props: TProps
}

/**
 * The full serialized state of a Gissen page. This is what gets saved and
 * loaded as JSON.
 */
export interface GissenData<TRootProps = Record<string, unknown>> {
  root: RootData<TRootProps>
  content: ComponentData[]
}
