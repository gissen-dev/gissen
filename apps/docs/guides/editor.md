# The editor

<GissenStatus />

What `GissenEditor` does for the people who use it, and what that means for your app.

<<< @/snippets/guides/editor/Sized.vue [Sized.vue]

## Layout and size

The editor has a sidebar of components on the left, a canvas in the middle and a properties panel on the right. It fills its parent with `height: 100%`, so the parent needs a height. A full-screen editor uses `100vh`. Inside a flex column, give the editor `flex: 1` and `min-height: 0`.

The canvas, sidebar and panel scroll on their own.

## Keyboard

| Key | Action |
|---|---|
| `Escape` | Deselect |
| `Delete`, `Backspace` | Delete the selected component |
| `Ctrl+Z`, `⌘Z` | Undo |
| `Ctrl+Shift+Z`, `⇧⌘Z`, `Ctrl+Y`, `⌘Y` | Redo |

Shortcuts work while focus is inside the canvas, so two editors on one page do not interfere. While a field has focus, `Ctrl+Z` is the browser's text undo and the document history is not touched.

A selected node also shows a small toolbar with a delete button. There is no confirmation. Undo is the safety net.

## Undo and redo

Every change can be undone: inserts, moves, deletes and property edits. History holds 100 steps and lives in memory only.

- Consecutive edits to the same field become one step.
- A new change clears the redo steps.
- If the selected node no longer exists after an undo, the selection is cleared.
- Replacing the bound `data` resets history.
- Each undo and redo emits `update:data`, like any edit.

## Viewport preview

The toolbar previews the canvas at desktop, tablet (768px) and mobile (375px) widths. This is editor state. It is not saved in the document, and Gissen has no per-breakpoint props. Responsive behavior belongs to your components.

The preview narrows a frame. It does not resize the browser window, so CSS media queries do not react. Container queries and `cq*` units do, because the frame is a size container. Flex wrapping and grid `auto-fill` work as usual.

## Wrapper elements

In the editor, each node sits inside `<div class="gissen-node">`. It draws the selection outline and handles dragging. `GissenRender` does not add it. Do not style your components through that wrapper.

## Theming

Override the CSS custom properties after importing `gissen/style.css`.

<<< @/snippets/guides/editor/theme.css [theme.css]

All variables are listed in the [API reference](../api/gissen#css-custom-properties). The editor's classes start with `gissen-`.
