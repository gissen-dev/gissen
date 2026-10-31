// eslint-disable-next-line ts/ban-ts-comment -- deliberately invalid file, see below
// @ts-nocheck
import { defineGissenConfig } from 'gissen'

// Calls defineComponent/h without importing them. Nuxt supplies both as
// build-time auto-imports, so a config like this works inside a Nuxt app
// and fails with a plain ReferenceError when gissen-mcp loads it standalone
// with Node/jiti. examples/nuxt-ssr avoids it by keeping its page root in a
// .vue file (components/PageRoot.vue) instead.
export default defineGissenConfig({
  components: {
    Broken: {
      fields: {},
      render: defineComponent({ render: () => h('div') }),
    },
  },
})
