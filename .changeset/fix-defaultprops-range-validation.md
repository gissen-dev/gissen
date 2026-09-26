---
"gissen": patch
---

Fixed a validation gap: `validateConfig` now rejects a component's `defaultProps` when a value for a non-slot field violates that field's own type, number `min`/`max`/finiteness, or select `options`, or when the key doesn't correspond to a declared field, is the reserved `id` key, or (for a non-slot field) is a literal `null`. Previously such a config passed `validateConfig` but produced a node that `validateData` immediately rejected — via `createComponent`, shared by the editor and `gissen-mcp`.
