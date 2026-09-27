# gissen-mcp

## 0.1.0-alpha.0

### Minor Changes

- First release of gissen-mcp: a Model Context Protocol server that lets an AI agent read and edit a Gissen page tree over stdio, constrained by your own config — the component types, fields, select options, and slot allow lists you declared become the tool schemas the agent sees, so an agent can only build with components you registered. Five tools: read_page, add_component, update_component, delete_component, move_component. Every rejected edit names what was wrong and what is available instead.

### Patch Changes

- Updated dependencies [aa0e87d]
  - gissen@0.1.0-alpha.7
