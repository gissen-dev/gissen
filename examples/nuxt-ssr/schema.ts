import type { ComponentData } from 'gissen'
import { defineGissenConfig } from 'gissen'

/**
 * Field schema for every component type: `fields`, `defaultProps`, slot
 * `allow` lists — everything except `render`. Shared by gissen.config.ts
 * (which attaches the real Vue components) and this file's own default
 * export (which attaches a no-op `render`), so the two configs cannot drift
 * apart the way splitting them by hand normally risks.
 *
 * The two `as const`s below are the one thing that does NOT come for free
 * once field definitions move out of a `defineGissenConfig` call: written
 * inline, `defineGissenConfig`'s generic infers select option literals on
 * its own (see the Defining components guide); factored out into a plain
 * object, that inference needs a nudge, or `cta`'s value type widens to
 * `string` and Hero.vue's `cta: 'get-started' | 'learn-more'` prop no
 * longer type-checks against it.
 */
export const fields = {
  Hero: {
    fields: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      cta: {
        type: 'select',
        label: 'CTA',
        options: [
          { label: 'Get started free', value: 'get-started' },
          { label: 'Learn more', value: 'learn-more' },
        ],
      },
    } as const,
    defaultProps: {
      title: 'Build pages visually',
      subtitle: 'Drag and drop your own Vue components. No lock-in, MIT licensed.',
      cta: 'get-started' as const,
    },
  },
  TextBlock: {
    fields: {
      heading: { type: 'text', label: 'Heading' },
      body: { type: 'textarea', label: 'Body' },
    } as const,
    defaultProps: {
      heading: 'How it works',
      body: 'Register your Vue components with a typed config. Users drag them onto the canvas — the output is plain JSON you render anywhere.',
    },
  },
  FeatureCard: {
    fields: {
      icon: { type: 'text', label: 'Icon (emoji)' },
      title: { type: 'text', label: 'Title' },
      description: { type: 'textarea', label: 'Description' },
      badge: { type: 'number', label: 'Badge number' },
      highlighted: { type: 'boolean', label: 'Highlighted' },
    } as const,
    defaultProps: {
      icon: '⚡',
      title: 'Feature',
      description: 'Describe what makes this feature great.',
      badge: 1,
      highlighted: false,
    },
  },
  Container: {
    fields: {
      children: { type: 'slot', label: 'Children' },
    } as const,
    defaultProps: { children: [] as ComponentData[] },
  },
}

/**
 * A render-free Gissen config. `render` is set to a no-op function on every
 * component — it exists only because `ComponentConfig` requires one, and it
 * is never called here. This is what lets server/api/page.put.ts validate
 * an incoming document without importing the Vue render stack: see the note
 * on the Nuxt docs page for why that import matters on this server.
 *
 * This split is a workaround, not a recommended pattern — `gissen.config.ts`
 * conflates field schema and render components, which is fine for a
 * Vite/Nuxt client bundle but breaks the moment something server-side (a
 * Nitro API route, here) needs the schema without a Vue-aware bundler. See
 * "Separate schema from render in the config API" in AUDIT_BACKLOG.md.
 */
export default defineGissenConfig({
  components: {
    Hero: { ...fields.Hero, render: () => null },
    TextBlock: { ...fields.TextBlock, render: () => null },
    FeatureCard: { ...fields.FeatureCard, render: () => null },
    Container: { ...fields.Container, render: () => null },
  },
})
