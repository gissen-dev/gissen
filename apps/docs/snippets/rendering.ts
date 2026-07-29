// Typecheck fixtures for the snippets in rendering.md, mirroring the
// documented code against the exported types so the docs cannot drift into a
// type-invalid state. Everything documented as importable from
// `gissen/render` is imported from `gissen/render` here.

import type { GissenData } from 'gissen/render'
import { GissenEditor, GissenRender, validateData } from 'gissen'
import { defineGissenConfig } from 'gissen/render'
import { h, ref } from 'vue'
import Hero from './components/Hero.vue'
import PageShell from './components/PageShell.vue'

// ── Basic usage ─────────────────────────────────────────────────────────────
// The documented `GissenData` value omits `version` — valid, the field is
// optional (tolerant-envelope policy).
const data: GissenData = { root: { props: {} }, content: [] }

// ── Root rendering ──────────────────────────────────────────────────────────
// `defineGissenConfig` imported from `gissen/render`, `root.render` receiving
// root props and the page content via its default slot.
const config = defineGissenConfig({
  components: {
    Hero: {
      fields: {
        title: { type: 'text' },
        count: { type: 'number' },
        cta: {
          type: 'select',
          options: [
            { label: 'Sign up', value: 'signup' },
            { label: 'Buy now', value: 'buy' },
          ],
        },
      },
      render: Hero,
    },
  },
  root: {
    fields: { theme: { type: 'text' } },
    defaultProps: { theme: 'light' },
    render: PageShell,
  },
})

// ── Props are the editor's config plus the editor-produced document ─────────
const rendered = h(GissenRender, { config, data })

// ── Strictness on the caller's side ─────────────────────────────────────────
const rawData: unknown = {}
const validated = validateData(rawData, config)

// ── Live preview: editor and renderer bound to the same ref ─────────────────
const doc = ref<GissenData>({ root: { props: {} }, content: [] })
const preview = [
  h(GissenEditor, { 'config': config, 'data': doc.value, 'onUpdate:data': (v: GissenData) => { doc.value = v } }),
  h(GissenRender, { config, data: doc.value }),
]

// Reference every binding so `noUnusedLocals` is satisfied without changing
// the documented snippet shapes above.
void [data, rendered, validated, preview]
