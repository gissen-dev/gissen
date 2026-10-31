import { defineGissenConfig } from 'gissen'
import Card from './components/Card.vue'
import Column from './components/Column.vue'
import Columns from './components/Columns.vue'
import Text from './components/Text.vue'

export default defineGissenConfig({
  components: {
    Columns: {
      fields: {
        // Only Column is allowed here: dropping a Card directly into
        // Columns is rejected, both on the canvas and by validateData.
        columns: { type: 'slot', label: 'Columns', allow: ['Column'] },
      },
      defaultProps: { columns: [] },
      render: Columns,
    },
    Column: {
      fields: {
        width: { type: 'number', label: 'Width (flex-grow)', min: 1, max: 4 },
        // A different allow list one level down: Card or Text, never
        // another layout component.
        children: { type: 'slot', label: 'Children', allow: ['Card', 'Text'] },
      },
      defaultProps: { width: 1, children: [] },
      render: Column,
    },
    Card: {
      fields: {
        title: { type: 'text', label: 'Title' },
        rating: { type: 'number', label: 'Rating', min: 0, max: 5, step: 1 },
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
      },
      defaultProps: { title: 'Card', rating: 3, size: 'md' },
      render: Card,
    },
    Text: {
      fields: {
        body: { type: 'textarea', label: 'Body' },
      },
      defaultProps: { body: 'Write something.' },
      render: Text,
    },
  },
})
