import { defineGissenConfig } from 'gissen'

// Deliberately invalid: `level`'s default (99) violates the field's own
// `max: 6` — `validateConfig` rejects this (see docs/devlog/phase-7.md,
// "validateConfig doesn't range-check defaultProps").
export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        level: { type: 'number', label: 'Level', min: 1, max: 6 },
      },
      defaultProps: {
        level: 99,
      },
      render: () => null,
    },
  },
})
