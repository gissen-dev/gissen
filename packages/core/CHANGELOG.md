# gissen

## 0.1.0-alpha.4

### Minor Changes

- Undo/redo history (coalesced property edits, Ctrl/Cmd+Z shortcuts), editor toolbar, viewport preview (desktop/tablet/mobile, scale-to-fit, preview-only), node delete button; fixes: listener leak on unmount, history reset by v-model echo, DataCloneError on snapshot.

## 0.1.0-alpha.3

### Minor Changes

- Add a properties panel with live field editors and a schema version field on the GissenData envelope. Harden data validation and close audit findings: slot allow-list enforcement, version contract, number constraints, and reserved id handling.
