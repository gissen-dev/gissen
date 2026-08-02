/**
 * Consumer-perspective type probe for the published `gissen` package.
 *
 * Compiled by vue-tsc in a scratch app OUTSIDE the monorepo against the packed
 * tarball — the environment where the `.vue`-import dts bug lived invisibly
 * for every alpha ≤ 0.1.0-alpha.5. It proves, empirically:
 *
 *   (a) `GissenEditor` and `GissenRender` are fully typed, not `any`
 *   (b) a malformed `config` is a type error
 *   (c) `defineGissenConfig` inference survives the package boundary
 *   (d) the `gissen/render` subpath types resolve
 *
 * Every `@ts-expect-error` doubles as a regression tripwire: if a declaration
 * regresses to `any`, the expected error disappears, the directive turns
 * "unused", and the probe fails.
 */
import type { GissenConfig, GissenData, GissenEditor, GissenRender } from 'gissen'
import type { GissenRender as GissenRenderFromSubpath, GissenConfig as SubpathGissenConfig } from 'gissen/render'
import type { PropType } from 'vue'
import { createComponent, defineGissenConfig, validateData } from 'gissen'
import { defineGissenConfig as defineFromRenderSubpath } from 'gissen/render'
import { defineComponent } from 'vue'

type IsAny<T> = 0 extends 1 & T ? true : false
type Assert<T extends true> = T
type MutuallyAssignable<A, B> = [A, B] extends [B, A] ? true : false

/* ------------------------------------------------------------------------- *
 * (a) The exported components are precisely typed — `any` fails these.      *
 * ------------------------------------------------------------------------- */

export type EditorIsNotAny = Assert<IsAny<typeof GissenEditor> extends false ? true : false>
export type RenderIsNotAny = Assert<IsAny<typeof GissenRender> extends false ? true : false>

type EditorProps = InstanceType<typeof GissenEditor>['$props']
type RenderProps = InstanceType<typeof GissenRender>['$props']

export type EditorConfigPropIsNotAny = Assert<IsAny<EditorProps['config']> extends false ? true : false>
export type EditorConfigPropIsGissenConfig = Assert<MutuallyAssignable<EditorProps['config'], GissenConfig>>
export type EditorDataPropIsGissenData = Assert<MutuallyAssignable<EditorProps['data'], GissenData>>
export type RenderConfigPropIsGissenConfig = Assert<MutuallyAssignable<RenderProps['config'], GissenConfig>>
export type RenderDataPropIsGissenData = Assert<MutuallyAssignable<RenderProps['data'], GissenData>>

/* ------------------------------------------------------------------------- *
 * (b) A malformed `config` (and other prop misuse) is a type error.         *
 * ------------------------------------------------------------------------- */

declare function acceptEditorProps(props: EditorProps): void
declare function acceptRenderProps(props: RenderProps): void

const validConfig: GissenConfig = { components: {} }
const validData: GissenData = { version: 1, root: { props: {} }, content: [] }

// Well-formed usage must compile, including a typed `update:data` payload.
acceptEditorProps({
  'config': validConfig,
  'data': validData,
  'onUpdate:data': (value) => {
    const typed: GissenData = value
    void typed
  },
})
acceptRenderProps({ config: validConfig, data: validData })

// @ts-expect-error (b) malformed config: `components` must be a record, not a number
acceptEditorProps({ config: { components: 42 }, data: validData })

// @ts-expect-error (b) malformed config: unknown top-level key
acceptEditorProps({ config: { components: {}, nope: true }, data: validData })

// @ts-expect-error (b) `config` is required
acceptEditorProps({ data: validData })

// @ts-expect-error (b) malformed data: not a GissenData document
acceptRenderProps({ config: validConfig, data: { nope: true } })

// @ts-expect-error (b) `config` is required on the renderer too
acceptRenderProps({ data: validData })

/* ------------------------------------------------------------------------- *
 * (c) `defineGissenConfig` inference survives the package boundary.         *
 * ------------------------------------------------------------------------- */

const HeroStub = defineComponent({
  props: {
    id: { type: String, required: true },
    title: String,
    cta: String as PropType<'get-started' | 'learn-more'>,
  },
  setup: () => () => null,
})

// A component may declare fewer props than the fields (it is free to ignore
// fields it doesn't render) — used below where the negative test must produce
// exactly one error, on the annotated line.
const LooseStub = defineComponent({
  props: { id: { type: String, required: true } },
  setup: () => () => null,
})

export const probeConfig = defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        cta: {
          type: 'select',
          label: 'CTA',
          options: [
            { label: 'Get started', value: 'get-started' },
            { label: 'Learn more', value: 'learn-more' },
          ],
        },
        children: { type: 'slot', label: 'Children' },
      },
      defaultProps: { title: 'Hello', cta: 'get-started', children: [] },
      render: HeroStub,
    },
  },
})

// Select option values narrow to their literal union across the boundary.
defineGissenConfig({
  components: {
    Hero: {
      fields: {
        cta: { type: 'select', options: [{ label: 'A', value: 'a' }] },
      },
      // @ts-expect-error (c) 'nope' is outside the inferred 'a' option union
      defaultProps: { cta: 'nope' },
      render: LooseStub,
    },
  },
})

// The define-site render check still rejects a component whose declared prop
// type contradicts the field type.
const WrongTitleStub = defineComponent({
  props: {
    id: { type: String, required: true },
    title: { type: Number },
  },
  setup: () => () => null,
})
defineGissenConfig({
  components: {
    Bad: {
      fields: { title: { type: 'text' } },
      // @ts-expect-error (c) component declares `title: number` for a text field
      render: WrongTitleStub,
    },
  },
})

// The phase-6 assignability fix holds across the boundary: an inferred config
// is a `GissenConfig`, usable with the editor props and the utility APIs.
export const widened: GissenConfig = probeConfig
acceptEditorProps({ config: probeConfig, data: validData })
export const revalidated: GissenData = validateData(validData, probeConfig)
export const heroNode = createComponent('Hero', probeConfig)

/* ------------------------------------------------------------------------- *
 * (d) The `gissen/render` subpath types resolve.                            *
 * ------------------------------------------------------------------------- */

export type SubpathRenderIsNotAny = Assert<IsAny<typeof GissenRenderFromSubpath> extends false ? true : false>

type SubpathRenderProps = InstanceType<typeof GissenRenderFromSubpath>['$props']

export type SubpathRenderConfigIsGissenConfig = Assert<MutuallyAssignable<SubpathRenderProps['config'], GissenConfig>>
export type SubpathTypeExportsMatchBarrel = Assert<MutuallyAssignable<SubpathGissenConfig, GissenConfig>>

export const renderOnlyConfig = defineFromRenderSubpath({ components: {} })
