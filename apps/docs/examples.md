# Examples

<GissenStatus />

Four runnable apps in the [Gissen repository](https://github.com/gissen-dev/gissen/tree/main/examples). Each is a standalone project: it depends on the published `gissen` (and, for one, `gissen-mcp`) from npm, not on this repository's workspace, and has its own `package-lock.json`. Clone the repository, or open one directly in StackBlitz.

```sh
cd examples/<name>
npm install
npm run dev
```

## vite-basic

Minimal Vue 3 + Vite: one component, the editor, and the renderer, side by side. This is also the [Quickstart](./getting-started/quickstart), file for file. It stays deliberately small; see layouts-and-slots for a feature tour.

[Source](https://github.com/gissen-dev/gissen/tree/main/examples/vite-basic) · [Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/vite-basic)

## nuxt-ssr

Nuxt 4, with the editor saving to a server route and a second page rendering the saved document on the server via `gissen/render`. Covers the manual [Nuxt integration](./getting-started/nuxt) end to end, including the workaround a Nitro API route needs to validate a write.

[Source](https://github.com/gissen-dev/gissen/tree/main/examples/nuxt-ssr) · [Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/nuxt-ssr)

## layouts-and-slots

Nested containers, two levels of slot `allow` lists, and the `select` and `number` field types. Shows the one CSS detail a slot-bearing component needs to look the same in the editor as in `GissenRender` (see [Matching the editor's wrappers](./guides/slots#matching-the-editor-s-wrappers)).

[Source](https://github.com/gissen-dev/gissen/tree/main/examples/layouts-and-slots) · [Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/layouts-and-slots)

## mcp-agent

A `page.json` an AI agent edits directly, with no editor UI in the app at all. The running page updates live, through the same Hot Module Replacement Vite already has, as `gissen-mcp` rewrites the file. Includes the client config for Claude Desktop and Cursor. See the [MCP guide](./agents/mcp) for what the agent can and cannot do.

[Source](https://github.com/gissen-dev/gissen/tree/main/examples/mcp-agent) · [Open in StackBlitz](https://stackblitz.com/github/gissen-dev/gissen/tree/main/examples/mcp-agent)

StackBlitz's WebContainers run the dev server in the browser tab; an external MCP client cannot reach it from outside. Clone the repository to connect a real agent to this one.
