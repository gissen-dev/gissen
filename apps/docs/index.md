---
layout: home

hero:
  name: Gissen
  text: A headless visual editor for Vue.
  tagline: You register your own Vue components, and Gissen adds the editor, the JSON document and the renderer.
  actions:
    - theme: brand
      text: Quickstart
      link: /getting-started/quickstart
    - theme: alt
      text: Playground
      link: /playground
    - theme: alt
      text: MCP guide
      link: /agents/mcp
    - theme: alt
      text: GitHub
      link: https://github.com/gissen-dev/gissen
---

<GissenStatus />

<DemoMedia kind="editor" />

## Install

```sh
npm install gissen
```

It needs Vue 3.4 or newer. The [Quickstart](./getting-started/quickstart) goes from an empty directory to a working editor in a few minutes, and the [Playground](./playground) lets you try the editor first, with nothing to install.

If you know [Puck](https://github.com/puckeditor/puck) for React, Gissen takes a similar approach for Vue.

## What you get

- **Your components.** Register your own Vue components and choose which props are editable. Gissen does not ship a component library.
- **Plain JSON.** The editor produces a JSON document. You decide where it is stored and how it is loaded.
- **The same render path.** `GissenRender` draws the document with your components and no editor code around them. It works on the server.

## AI agents

An AI agent can edit the same page through [`gissen-mcp`](./agents/mcp), a Model Context Protocol server. The agent is held to your config: it can add the component types you registered, set the fields you declared, and nothing else. Every refusal says what was wrong and what is allowed.

<DemoMedia kind="agent" />

Setup for Claude Desktop and Cursor, and every error message an agent can get, are in the [MCP guide](./agents/mcp).
