import { defineGissenConfig } from 'gissen'

// Deliberately references an undefined identifier — mirrors the failure
// class hit by examples/basic-nuxt/gissen.config.ts, which calls
// `defineComponent`/`h` without importing them (they're Nuxt build-time
// auto-imports, unavailable when a config is loaded standalone).
export default defineGissenConfig({
  components: {
    Broken: {
      fields: {},
      render: defineComponent({ render: () => null }),
    },
  },
})
