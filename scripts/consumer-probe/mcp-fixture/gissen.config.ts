import { defineGissenConfig } from 'gissen'

// Deliberately self-contained: no .vue/.css imports. A real consumer's
// config does import those (they're stubbed by jiti at load time — see
// packages/mcp/README.md's "config constraint" section), but the probe
// only needs a config gissen-mcp can load and derive a grammar from, and
// keeping it free of asset imports keeps this fixture from depending on
// anything the tarball install doesn't provide. Covers all six field
// types, plus a slot with an `allow` list and one without.
export default defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text', label: 'Title' },
        subtitle: { type: 'textarea', label: 'Subtitle' },
        rating: { type: 'number', label: 'Rating', min: 0, max: 5 },
        active: { type: 'boolean', label: 'Active' },
        theme: {
          type: 'select',
          label: 'Theme',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
          ],
        },
      },
      defaultProps: { title: 'Hello', subtitle: 'World', rating: 5, active: true, theme: 'primary' },
      render: () => null,
    },
    Container: {
      fields: {
        children: { type: 'slot', label: 'Children', allow: ['Hero'] },
      },
      defaultProps: { children: [] },
      render: () => null,
    },
    Freeform: {
      fields: {
        items: { type: 'slot', label: 'Items' },
      },
      defaultProps: { items: [] },
      render: () => null,
    },
  },
  root: {
    fields: {
      siteName: { type: 'text', label: 'Site name' },
    },
  },
})
