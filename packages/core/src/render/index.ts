/**
 * The `gissen/render` subpath: the production render path with none of the
 * editor stack behind it. Apps that only render editor-produced documents
 * import from here so an editor-free bundle is guaranteed by construction,
 * on any bundler. (Since the build splits this entry into its own chunk,
 * importing `GissenRender` from the main barrel also tree-shakes clean on
 * modern bundlers — but older Rollup-based ones retain the validation
 * stack's module-scope zod schemas. The subpath is the contract.)
 *
 * `defineGissenConfig` (a dependency-free identity helper) is exported here
 * too so a config module shared between the editor app and a render-only app
 * can import it without pulling the barrel into the render-only bundle.
 */
export { defineGissenConfig } from '../define'
export type {
  BooleanField,
  ComponentConfig,
  ComponentData,
  FieldConfig,
  FieldType,
  GissenConfig,
  GissenData,
  InferComponentProps,
  InferFieldType,
  InferRenderProps,
  NumberField,
  RootConfig,
  RootData,
  SelectField,
  SlotField,
  TextareaField,
  TextField,
} from '../types'
export { default as GissenRender } from './GissenRender'
