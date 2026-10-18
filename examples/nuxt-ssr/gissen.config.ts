import { defineGissenConfig } from 'gissen'
import Container from './components/Container.vue'
import FeatureCard from './components/FeatureCard.vue'
import Hero from './components/Hero.vue'
import TextBlock from './components/TextBlock.vue'
import { fields } from './schema'

// The client config: schema.ts's field definitions, each paired with its
// real Vue component. See schema.ts for why the schema lives there instead
// of being written out again here.
export default defineGissenConfig({
  components: {
    Hero: { ...fields.Hero, render: Hero },
    TextBlock: { ...fields.TextBlock, render: TextBlock },
    FeatureCard: { ...fields.FeatureCard, render: FeatureCard },
    Container: { ...fields.Container, render: Container },
  },
  root: {
    render: defineComponent({
      setup: (_, { slots }) =>
        () => h('main', { style: 'background:#f5f3f0; padding:2rem;' }, slots.default?.()),
    }),
  },
})
