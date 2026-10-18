---
layout: home

hero:
  name: Gissen
  text: A headless visual editor for Vue.
  tagline: You keep your components. Gissen adds the editor and the renderer.
  actions:
    - theme: brand
      text: Quickstart
      link: /getting-started/quickstart
    - theme: alt
      text: API reference
      link: /api/gissen

features:
  - title: Your components
    details: Register your own Vue components and choose which props are editable. Gissen does not ship a component library.
  - title: Plain JSON
    details: The editor produces a JSON document. You decide where it is stored and how it is loaded.
  - title: Same render path
    details: GissenRender draws the document with your components and no editor code around them. It works on the server.
---

<GissenStatus />
