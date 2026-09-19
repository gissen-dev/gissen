import { defineGissenConfig } from 'gissen'

// A second, contrasting config for tests that assert a tool schema's enum
// tracks the LOADED config rather than being hardcoded: one component, no
// slots, no root fields, and an inline `render` (no `.vue`/`.css` imports)
// so it loads fast and the contrast with the primary fixture can't be an
// accident of shared components.
export default defineGissenConfig({
  components: {
    Note: {
      fields: {
        body: { type: 'textarea' },
      },
      render: () => null,
    },
  },
})
