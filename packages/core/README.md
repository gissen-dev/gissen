# gissen

A headless visual editor and renderer for Vue 3.

Gissen is in alpha. APIs can change between releases. Do not use it in production.

You register your own Vue components with a typed config. Gissen adds the editor, the JSON document and the renderer. An AI agent can edit the same page through [`gissen-mcp`](https://www.npmjs.com/package/gissen-mcp), held to your config.

If you know [Puck](https://github.com/puckeditor/puck) for React, Gissen takes a similar approach for Vue.

## Install

```sh
npm install gissen
```

It needs Vue 3.4 or newer.

## Start here

- [Quickstart](https://gissen.dev/getting-started/quickstart): an empty directory to a working editor.
- [Playground](https://gissen.dev/playground): try the editor in your browser.
- [Guides](https://gissen.dev/guides/defining-components) and the [API reference](https://gissen.dev/api/gissen).
- [AI agents (MCP)](https://gissen.dev/agents/mcp).

## Entry points

- `gissen`: the editor, the renderer, helpers, validation and all types.
- `gissen/render`: the renderer only, with no editor code, for apps that only render.
- `gissen/style.css`: the editor stylesheet.

## License

[MIT](https://github.com/gissen-dev/gissen/blob/main/LICENSE)
