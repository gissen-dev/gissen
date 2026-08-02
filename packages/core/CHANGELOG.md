# gissen

## 0.1.0-alpha.6

### Patch Changes

- Fixed the published type declarations: dist/\*.d.ts are now self-contained (no .vue imports), so GissenEditor is fully typed for consumers — the config prop and v-model:data are type-checked, and defineGissenConfig inference survives the package boundary. The editor now degrades gracefully instead of crashing at startup when a root.render component does not render its default slot (drag-and-drop is skipped with a clear dev-mode error). LICENSE is now included in the npm tarball.

## 0.1.0-alpha.5

### Minor Changes

- Add the production render path: <GissenRender> renders editor-produced JSON with zero wrapper elements and verified SSR/hydration in Nuxt, including root rendering (config.root.render) in both the editor canvas and the renderer. Ship a tree-shakeable gissen/render subpath (renderer + types + defineGissenConfig, no editor stack) and fix the config type surface: defineGissenConfig results are now assignable to GissenConfig, and render components are checked against the props they actually receive.

## 0.1.0-alpha.4

### Minor Changes

- Undo/redo history (coalesced property edits, Ctrl/Cmd+Z shortcuts), editor toolbar, viewport preview (desktop/tablet/mobile, scale-to-fit, preview-only), node delete button; fixes: listener leak on unmount, history reset by v-model echo, DataCloneError on snapshot.

## 0.1.0-alpha.3

### Minor Changes

- Add a properties panel with live field editors and a schema version field on the GissenData envelope. Harden data validation and close audit findings: slot allow-list enforcement, version contract, number constraints, and reserved id handling.
