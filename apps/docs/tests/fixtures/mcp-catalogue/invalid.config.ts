import { defineGissenConfig } from 'gissen'
import Hero from '../../../snippets/agents/components/Hero.vue'

// defaultProps.rating is out of the field's own min/max range — rejected by
// validateConfig before the server ever starts.
export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        rating: { type: 'number', min: 0, max: 5 },
      },
      // Out of range at runtime (rejected by validateConfig), not a type
      // error: `min`/`max` are not enforced in the type system.
      defaultProps: { rating: 99 },
      render: Hero,
    },
  },
})
