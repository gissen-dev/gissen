// @vitest-environment node
//
// Runs in a plain node environment on purpose: there is no `window` or
// `document` here, so any browser-API access on the server render path throws
// instead of silently passing under jsdom.
import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import GissenRender from '../../src/render/GissenRender'

const Hero: Component = defineComponent({
  props: { id: String, title: String },
  template: '<section class="hero"><h1>{{ title }}</h1></section>',
})

const Columns: Component = defineComponent({
  props: { id: String },
  template: '<div class="columns">'
    + '<div class="col-left"><slot name="left" /></div>'
    + '<div class="col-right"><slot name="right" /></div>'
    + '</div>',
})

const Button: Component = defineComponent({
  props: { id: String, label: String },
  template: '<button class="btn">{{ label }}</button>',
})

const PageShell: Component = defineComponent({
  props: { theme: String },
  template: '<main class="shell" :data-theme="theme"><slot /></main>',
})

const config: GissenConfig = {
  components: {
    Hero: { fields: { title: { type: 'text' } }, render: Hero },
    Columns: { fields: { left: { type: 'slot' }, right: { type: 'slot' } }, render: Columns },
    Button: { fields: { label: { type: 'text' } }, render: Button },
  },
}

function sampleData(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      { type: 'Hero', props: { id: 'hero-1', title: 'Server side' } },
      {
        type: 'Columns',
        props: {
          id: 'cols-1',
          left: [{ type: 'Button', props: { id: 'btn-1', label: 'Left' } }],
          right: [{ type: 'Button', props: { id: 'btn-2', label: 'Right' } }],
        },
      },
    ],
  }
}

function ssrApp(data: GissenData, cfg: GissenConfig = config) {
  return createSSRApp({ render: () => h(GissenRender, { config: cfg, data }) })
}

describe('gissenRender SSR', () => {
  it('renders the document to a string on the server (no browser APIs)', async () => {
    const html = await renderToString(ssrApp(sampleData()))
    expect(html).toContain('<section class="hero"><h1>Server side</h1></section>')
    expect(html).toContain('<button class="btn">Left</button>')
    expect(html).toContain('<button class="btn">Right</button>')
    // Zero wrappers server-side too: no editor chrome markers.
    expect(html).not.toContain('gissen-')
  })

  it('produces deterministic output from (config, data)', async () => {
    const first = await renderToString(ssrApp(sampleData()))
    const second = await renderToString(ssrApp(sampleData()))
    expect(second).toBe(first)
  })

  it('renders the root wrapper on the server', async () => {
    const rootConfig: GissenConfig = {
      components: config.components,
      root: { fields: { theme: { type: 'text' } }, render: PageShell },
    }
    const data = sampleData()
    data.root.props = { theme: 'dark' }
    const html = await renderToString(ssrApp(data, rootConfig))
    expect(html).toContain('<main class="shell" data-theme="dark">')
  })
})
