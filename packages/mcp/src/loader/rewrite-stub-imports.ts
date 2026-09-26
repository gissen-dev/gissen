import { isStubSpecifier, STUB_MODULE_ID } from './stub-modules'

/**
 * Matches a static `import` statement's quoted specifier: both
 * `import ... from '<specifier>'` (default/named/namespace imports) and the
 * side-effect-only `import '<specifier>'` form. Deliberately does not match
 * `export ... from '<specifier>'` re-exports or dynamic `import()` calls —
 * decision 4 requires a Gissen config to be free of side effects beyond the
 * `defineGissenConfig` call, which in practice means a flat list of static
 * top-level imports feeding straight into one config object literal; neither
 * re-exporting nor dynamically importing a component module fits that shape.
 * A re-export of a stub-extension file is still handled safely: it's left
 * unrewritten, jiti then tries to resolve the real (e.g. `.vue`) file, and
 * that fails loudly with an instructive `ConfigLoadError` — not silently.
 *
 * Anchored to the start of a line (`^`, with `m`) so `import` only matches
 * where a real import statement can actually start, not anywhere the
 * substring `import ... from '...'` happens to appear — e.g. inside a
 * string literal used as a field's example text (a config's `label: "e.g.
 * import Hero from './Hero.vue'"` must not get its text silently rewritten).
 * This isn't a full parse — a template literal whose *content* happens to
 * start a line with real import-statement syntax would still be a false
 * positive — but decision 4's flat, single-import-per-line shape (the only
 * shape a real Gissen config needs) makes that vanishingly unlikely; a
 * proper fix would use a lexer (e.g. `es-module-lexer`) instead of a regex.
 */
const STATIC_IMPORT_RE = /^[ \t]*import\s[^'"]*(['"])([^'"]+)\1/gm

/**
 * Rewrites every statically-imported `.vue`/`.css`/asset specifier in a
 * config module's source to the shared stub module id, so a jiti instance
 * configured with `virtualModules: { [STUB_MODULE_ID]: STUB_MODULE_VALUE }`
 * (see `create-config-jiti.ts`) can evaluate the module without the
 * consumer's Vue/CSS/asset build pipeline present.
 *
 * jiti's own `alias` option only supports path-prefix mapping (not
 * extension-based matching), and its `extensions`+`transform` hooks proved
 * unreliable for non-JS/TS extensions in testing — jiti's internal
 * ESM/CommonJS format detection is keyed off the file extension before a
 * custom `transform` ever runs, so a `.vue` file transformed to `export
 * default {}` still gets evaluated as if it were CommonJS and fails to
 * parse. Rewriting the specifier and using jiti's documented, exact-match
 * `virtualModules` sidesteps format detection entirely.
 */
export function rewriteStubImports(source: string): string {
  return source.replace(STATIC_IMPORT_RE, (full, quote: string, specifier: string) => {
    if (!isStubSpecifier(specifier))
      return full
    return full.replace(`${quote}${specifier}${quote}`, `${quote}${STUB_MODULE_ID}${quote}`)
  })
}
