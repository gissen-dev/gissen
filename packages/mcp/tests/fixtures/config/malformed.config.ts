import { defineGissenConfig } from 'gissen'

// Deliberately invalid: `id` is a reserved field key (it's the node identity
// used for selection, move, and removal) — `validateConfig` rejects this.
export default defineGissenConfig({
  components: {
    Broken: {
      fields: {
        id: { type: 'text' },
      },
      render: () => null,
    },
  },
})
