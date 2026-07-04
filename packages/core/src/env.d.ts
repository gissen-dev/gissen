// Build-time dev flag for the deep-reactivity guard in `useEditorStore`
// (M-2/M-3). Replaced by the `define` in vite.config.ts with a consumer-
// evaluable `process.env.NODE_ENV !== 'production'` expression, so the guard
// stays active in a consumer's dev build and tree-shakes in their production
// build. `@types/node` is intentionally not a dependency.
declare const __DEV__: boolean
