/**
 * Extensions whose imports get replaced by an inert stub module when loading
 * a Gissen config. The MCP server only ever needs `fields`/`allow` from the
 * config, never `render` — and `ComponentConfig.render` is deliberately
 * typed as the loose `Component`, so a stub trivially satisfies it. This
 * lets a config be loaded without the consumer's Vue/CSS/asset build
 * pipeline present.
 */
export const STUB_EXTENSIONS = [
  '.vue',
  '.css',
  '.scss',
  '.sass',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.avif',
] as const

/** Whether an import specifier or file path should resolve to the inert stub. */
export function isStubSpecifier(specifier: string): boolean {
  const lower = specifier.toLowerCase()
  return STUB_EXTENSIONS.some(ext => lower.endsWith(ext))
}

/**
 * Virtual module id every stubbed import is rewritten to point at (see
 * `rewriteStubImports`). The leading `\0` is the conventional marker (used
 * by Rollup and friends) for a synthetic id that should never collide with a
 * real file path.
 */
export const STUB_MODULE_ID = '\0gissen-mcp-stub'

/** The module namespace object returned for every stubbed import. */
export const STUB_MODULE_VALUE = { default: {} }
