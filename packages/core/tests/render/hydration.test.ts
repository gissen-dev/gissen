import type { Component } from 'vue'
import type { GissenConfig, GissenData } from '../../src/types'
import { describe, expect, it, vi } from 'vitest'
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

const PageShell: Component = defineComponent({
  props: { theme: String },
  template: '<main class="shell" :data-theme="theme"><slot /></main>',
})

const config: GissenConfig = {
  components: {
    Hero: { fields: { title: { type: 'text' } }, render: Hero },
    Columns: { fields: { left: { type: 'slot' }, right: { type: 'slot' } }, render: Columns },
  },
}

function sampleData(): GissenData {
  return {
    version: 1,
    root: { props: {} },
    content: [
      // Two top-level nodes: the bare-fragment case is the harder hydration
      // shape (multiple roots, comment anchors).
      { type: 'Hero', props: { id: 'hero-1', title: 'Hydrate me' } },
      {
        type: 'Columns',
        props: {
          id: 'cols-1',
          left: [{ type: 'Hero', props: { id: 'hero-2', title: 'Nested' } }],
          right: [],
        },
      },
    ],
  }
}

/**
 * Server-renders the document, injects the HTML the way a real SSR response
 * arrives, hydrates a fresh app over it, and returns everything Vue logged.
 * Hydration mismatches surface as console warnings/errors in dev builds.
 */
async function renderAndHydrate(cfg: GissenConfig, data: GissenData) {
  const app = () => createSSRApp({ render: () => h(GissenRender, { config: cfg, data }) })

  const html = await renderToString(app())

  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)

  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const client = app()
  client.mount(container)
  const logged = [...warn.mock.calls, ...error.mock.calls].map(call => String(call[0]))
  warn.mockRestore()
  error.mockRestore()

  const hydratedHtml = container.innerHTML
  client.unmount()
  container.remove()
  return { html, hydratedHtml, logged }
}

describe('gissenRender hydration', () => {
  it('hydrates a bare-fragment document without mismatch warnings', async () => {
    const { html, hydratedHtml, logged } = await renderAndHydrate(config, sampleData())
    expect(logged).toEqual([])
    // The DOM after hydration is the DOM the server sent.
    expect(hydratedHtml).toBe(html)
    expect(hydratedHtml).toContain('<h1>Hydrate me</h1>')
  })

  it('hydrates a root-wrapped document without mismatch warnings', async () => {
    const rootConfig: GissenConfig = {
      components: config.components,
      root: { fields: { theme: { type: 'text' } }, render: PageShell },
    }
    const data = sampleData()
    data.root.props = { theme: 'dark' }
    const { hydratedHtml, logged } = await renderAndHydrate(rootConfig, data)
    expect(logged).toEqual([])
    expect(hydratedHtml).toContain('<main class="shell" data-theme="dark">')
  })
})
