import type { FieldConfig } from 'gissen'

// #region text
const title = { type: 'text', label: 'Title' } satisfies FieldConfig
// #endregion text

// #region textarea
const bio = { type: 'textarea', label: 'Bio', rows: 4 } satisfies FieldConfig
// #endregion textarea

// #region number
const count = { type: 'number', label: 'Count', min: 0, max: 100, step: 5 } satisfies FieldConfig
// #endregion number

// #region boolean
const active = { type: 'boolean', label: 'Active' } satisfies FieldConfig
// #endregion boolean

// #region select
const variant = {
  type: 'select',
  label: 'Variant',
  options: [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
  ],
} satisfies FieldConfig
// #endregion select

// #region slot
const children = { type: 'slot', label: 'Children', allow: ['Card', 'Text'] } satisfies FieldConfig
// #endregion slot

// Reference every binding so `noUnusedLocals` stays satisfied.
void [title, bio, count, active, variant, children]
