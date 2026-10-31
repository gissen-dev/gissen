import { defineGissenConfig } from 'gissen'

// Deliberately references an undefined identifier — mirrors the failure
// class a config hits when it leans on build-time auto-imports, e.g. calling
// `defineComponent`/`h` the way Nuxt's auto-imports allow, without importing
// them (they are unavailable when a config is loaded standalone).
export default defineGissenConfig({
  components: {
    Broken: {
      fields: {},
      render: defineComponent({ render: () => null }),
    },
  },
})
