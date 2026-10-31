import { defineGissenConfig } from 'gissen'

// A small config with a slot, so the server registers every tool the way it
// would for a real project. The components render nothing: the server never
// renders, it only reads the config.
export default defineGissenConfig({
  components: {
    Hero: {
      fields: { title: { type: 'text' } },
      defaultProps: { title: 'Hello' },
      render: () => null,
    },
    Container: {
      fields: { children: { type: 'slot' } },
      render: () => null,
    },
  },
})
