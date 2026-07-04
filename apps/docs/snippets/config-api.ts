// Typecheck fixtures for the snippets in config-api.md. These mirror the
// documented code against the exported Gissen types so the docs cannot drift
// into a type-invalid state (the H-1 class: shipped, uncompiled examples).

import type { GissenConfig } from 'gissen'
import {
  createComponent,
  createEmptyData,
  defineGissenConfig,
  ensureId,
  generateId,
  GissenValidationError,
  validateConfig,
  validateData,
} from 'gissen'
import Hero from './components/Hero.vue'
import PricingCard from './components/PricingCard.vue'

// ── Defining a config ───────────────────────────────────────────────────────
// `defineGissenConfig` infers prop types from `fields` and type-checks
// `defaultProps` against them (e.g. `cta` is narrowed to `'signup' | 'buy'`).
const definedConfig = defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        count: { type: 'number' },
        cta: {
          type: 'select',
          options: [
            { label: 'Sign up', value: 'signup' },
            { label: 'Buy now', value: 'buy' },
          ],
        },
      },
      defaultProps: { title: 'Hello', count: 0, cta: 'signup' },
      render: Hero,
    },
    PricingCard: {
      fields: {
        name: { type: 'text' },
        featured: { type: 'boolean' },
        features: { type: 'slot' },
      },
      defaultProps: { name: '', featured: false, features: [] },
      render: PricingCard,
    },
  },
})

// ── Field type snippets ─────────────────────────────────────────────────────
const titleField = { type: 'text' as const, label: 'Title' }
const bioField = { type: 'textarea' as const, label: 'Bio', rows: 4 }
const countField = { type: 'number' as const, label: 'Count', min: 0, max: 100 }
const activeField = { type: 'boolean' as const, label: 'Active' }
const variantField = {
  type: 'select' as const,
  options: [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
  ],
}
const childrenField = { type: 'slot' as const, allow: ['Card', 'Text'] }

// ── Runtime validation ──────────────────────────────────────────────────────
// As documented, these operate on a config/data loaded from an external source,
// so the config here is the validated `GissenConfig`.
const rawConfig: unknown = {}
const rawData: unknown = {}

let config: GissenConfig | undefined

try {
  config = validateConfig(rawConfig)
}
catch (error) {
  if (error instanceof GissenValidationError) {
    console.error(error.issues) // ZodIssue[]
  }
}

try {
  const data = validateData(rawData, validateConfig(rawConfig))
  void data
}
catch (error) {
  if (error instanceof GissenValidationError) {
    // error.message contains paths like content[0].props.title
    console.error(error.message)
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────
const page = createEmptyData()
const hero = createComponent('Hero', validateConfig(rawConfig))
const id = generateId()
const component = ensureId({ type: 'Hero', props: { id: '', title: 'Hello' } })

// Reference every binding so `noUnusedLocals` is satisfied without changing the
// documented snippet shapes above.
void [definedConfig, config, titleField, bioField, countField, activeField, variantField, childrenField, page, hero, id, component]
