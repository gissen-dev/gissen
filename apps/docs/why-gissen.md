---
title: Why Gissen
search: false
---

# Why Gissen

::: danger DRAFT
This page is a draft for the project owner to rewrite. It is not built into the site, it is not in the navigation and it is not searchable. Read it locally with `DOCS_DRAFTS=1 pnpm --filter gissen-docs dev`. To publish it, follow the note above `srcExclude` in `.vitepress/config.ts`.
:::

<GissenStatus />

## The problem

You have a Vue app with your own components. Someone who is not a developer needs to build or change pages from them: a marketing page, a landing page, a section of the product. You want them to work with the components you already have, in your styles and with your props.

You do not want a second set of blocks that look almost the same, and you do not want to hand over your front end to do it.

Gissen is a visual editor for exactly that. You describe your components once. People assemble pages from them in a browser, and your app renders the result.

## The design choices

**Headless.** Gissen gives you the editor surface and the renderer. It does not ship components, a page store, accounts or a CMS. Storage, authentication and the rest of the app stay yours.

**Driven by one config.** A single `defineGissenConfig` call lists your components, their editable fields and where children may go. The editor, the validation of saved documents and the tools an AI agent gets are all derived from it.

**The same render path in the editor and in production.** The editor canvas resolves each node the same way `GissenRender` does, so what you edit is what ships. The editor adds wrapper elements for selection and dragging, and `GissenRender` adds none.

**Agents are held to the config.** `gissen-mcp` builds its tool schemas from the same config. An agent can add the component types you registered and set the fields you declared, and nothing else. See the [MCP guide](./agents/mcp).

**Plain JSON in, plain JSON out.** The page is a JSON document. You can store it in a database, a file or a Git repository, and you can validate it before you render it.

## When not to use Gissen

- **You use React.** Look at [Puck](https://github.com/puckeditor/puck), which is built for React.
- **You need a stable API today.** Gissen is in alpha, and the API can change between releases.
- **You need a finished CMS.** Gissen has no storage, accounts, roles, drafts or collaboration. You build those around it.
- **You need different props per breakpoint.** A document has one set of props. Responsive behavior belongs to your components.
- **Your editors work on phones.** The editor is built for a wide screen.
- **You need an agent to work on many pages at once.** `gissen-mcp` serves one page file per server.
