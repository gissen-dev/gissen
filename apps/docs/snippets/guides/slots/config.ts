import { defineGissenConfig } from 'gissen'
import Card from './components/Card.vue'
import Container from './components/Container.vue'
import Text from './components/Text.vue'

export default defineGissenConfig({
  components: {
    Container: {
      fields: {
        columns: { type: 'number', label: 'Columns', min: 1, max: 4 },
        // Containers accept cards only.
        children: { type: 'slot', label: 'Children', allow: ['Card'] },
      },
      defaultProps: { columns: 2 },
      render: Container,
    },
    Card: {
      fields: {
        heading: { type: 'text', label: 'Heading' },
        // No allow list: any registered type can go in here.
        body: { type: 'slot', label: 'Body' },
      },
      defaultProps: { heading: 'Card' },
      render: Card,
    },
    Text: {
      fields: {
        text: { type: 'textarea', label: 'Text' },
      },
      defaultProps: { text: 'Write something.' },
      render: Text,
    },
  },
})
