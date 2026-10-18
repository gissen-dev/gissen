// eslint-disable-next-line ts/ban-ts-comment -- deliberately invalid file, see below
// @ts-nocheck
import { defineGissenConfig } from 'gissen'

// Calls defineComponent/h without importing them. Nuxt supplies both as
// build-time auto-imports in a real Nuxt project (see examples/nuxt-ssr's
// own config), which don't exist when gissen-mcp loads this file standalone
// with Node/jiti — the config fails with a plain ReferenceError.
export default defineGissenConfig({
  components: {
    Broken: {
      fields: {},
      render: defineComponent({ render: () => h('div') }),
    },
  },
})
