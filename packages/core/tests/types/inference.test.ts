import type { ComponentData, InferComponentProps, InferFieldType } from '../../src/types'
import { describe, expectTypeOf, it } from 'vitest'
import { defineGissenConfig } from '../../src'

describe('inferFieldType', () => {
  it('maps TextField to string', () => {
    expectTypeOf<InferFieldType<{ type: 'text' }>>().toEqualTypeOf<string>()
  })

  it('maps TextareaField to string', () => {
    expectTypeOf<InferFieldType<{ type: 'textarea' }>>().toEqualTypeOf<string>()
  })

  it('maps NumberField to number', () => {
    expectTypeOf<InferFieldType<{ type: 'number' }>>().toEqualTypeOf<number>()
  })

  it('maps BooleanField to boolean', () => {
    expectTypeOf<InferFieldType<{ type: 'boolean' }>>().toEqualTypeOf<boolean>()
  })

  it('maps SlotField to ComponentData[]', () => {
    expectTypeOf<InferFieldType<{ type: 'slot' }>>().toEqualTypeOf<ComponentData[]>()
  })

  it('maps SelectField options to a literal value union', () => {
    type Options = readonly [
      { readonly label: 'Sign up', readonly value: 'signup' },
      { readonly label: 'Buy now', readonly value: 'buy' },
    ]
    expectTypeOf<InferFieldType<{ type: 'select', options: Options }>>().toEqualTypeOf<'signup' | 'buy'>()
  })

  it('maps SelectField with numeric options to a numeric literal union', () => {
    type Options = readonly [
      { readonly label: 'One', readonly value: 1 },
      { readonly label: 'Two', readonly value: 2 },
    ]
    expectTypeOf<InferFieldType<{ type: 'select', options: Options }>>().toEqualTypeOf<1 | 2>()
  })
})

describe('inferComponentProps', () => {
  it('maps a fields record to a props object', () => {
    expectTypeOf<InferComponentProps<{
      title: { type: 'text' }
      count: { type: 'number' }
      active: { type: 'boolean' }
    }>>().toEqualTypeOf<{
      title: string
      count: number
      active: boolean
    }>()
  })

  it('produces a literal union for SelectField props', () => {
    expectTypeOf<InferComponentProps<{
      cta: {
        type: 'select'
        options: readonly [
          { readonly label: 'Sign up', readonly value: 'signup' },
          { readonly label: 'Buy now', readonly value: 'buy' },
        ]
      }
    }>['cta']>().toEqualTypeOf<'signup' | 'buy'>()
  })

  it('produces ComponentData[] for SlotField props', () => {
    expectTypeOf<InferComponentProps<{ items: { type: 'slot' } }>['items']>().toEqualTypeOf<ComponentData[]>()
  })
})

describe('defineGissenConfig type inference', () => {
  it('infers defaultProps types from fields', () => {
    const config = defineGissenConfig({
      components: {
        Hero: {
          fields: {
            title: { type: 'text' } as const,
            count: { type: 'number' } as const,
          },
          defaultProps: { title: 'Hello', count: 0 },
          render: {} as import('vue').Component,
        },
      },
    })

    expectTypeOf(config.components.Hero.defaultProps?.title).toEqualTypeOf<string | undefined>()
    expectTypeOf(config.components.Hero.defaultProps?.count).toEqualTypeOf<number | undefined>()
  })

  it('narrows SelectField defaultProps to the literal union', () => {
    const config = defineGissenConfig({
      components: {
        Card: {
          fields: {
            variant: {
              type: 'select' as const,
              options: [
                { label: 'Primary', value: 'primary' },
                { label: 'Secondary', value: 'secondary' },
              ] as const,
            },
          },
          defaultProps: { variant: 'primary' },
          render: {} as import('vue').Component,
        },
      },
    })

    expectTypeOf(config.components.Card.defaultProps?.variant).toEqualTypeOf<'primary' | 'secondary' | undefined>()
  })
})
