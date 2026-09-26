# Phase 7 — MCP server (`gissen-mcp`)

## 2026-09-19 — a review agent caught a mutation silently narrowing file permissions

Independent review of the atomic write (`packages/mcp/src/data-file.ts`)
found that `open(path, 'wx', mode)` is masked by the process umask — a
deliberately group-writable `0o664` data file came back `0o644` after one
mutation under the common `022` umask, silently, with no error and no
mention in the success message. Worse: the existing test asserting
permission preservation used `0o640`, a mode `022` doesn't touch, so it had
been green for the wrong reason since the write path was written. Verified
independently with a plain Node script before touching any code: `open`
with mode `0o664` came back `644`; an explicit `fchmod` after opening came
back `664` — umask does not apply to `chmod`. Fixed by opening with no mode
and calling `handle.chmod(mode)` once the file is open, and the test now
uses `0o664` so it can actually fail again if this regresses. Confirmed
against the real built binary, not just the unit test: a scratch file
`chmod 664`, a mutation through a live MCP session, mode still `664` after.

## 2026-09-19 — an empty `inputSchema` is broken, not just unnecessary

The locked brief assumed tool schemas derived from the grammar could be
plain JSON Schema; the installed `@modelcontextprotocol/sdk` (1.29.0)
accepts Zod only — a raw JSON Schema object throws at registration time.
Read the actual shipped `server/mcp.js` and `server/zod-compat.js` rather
than the docs. That surfaced a second, sharper problem: passing an empty
raw shape (`{}`) for `read_page`, which takes no arguments, doesn't work
either — `normalizeObjectSchema({})` returns `undefined`, and the SDK then
tries to parse the call's arguments against a non-schema. The fix is to
omit `inputSchema` entirely for a no-argument tool
(`packages/mcp/src/server/tools/read-page-tool.ts`). Also recorded, not
fixed: because `add_component`'s type enum has to live in the schema for
`tools/list` to advertise it, a bad enum value is rejected by the SDK
*before* our own instructive wording ever runs — the one rejection shape an
agent sees in the SDK's raw Zod voice instead of ours
(`packages/mcp/src/server/tool-result.ts`).

## 2026-09-19 — the stdio transport never noticed a client hanging up

`StdioServerTransport.start()` only subscribes to stdin's `'data'` and
`'error'` events — closing the client's end of the pipe never fires
`'end'`, so the server sits forever, and the process only exits because no
handles remain, with `process.exitCode` never assigned. Confirmed by
reading the SDK's actual `dist/esm/server/stdio.js`, then confirmed the fix
against a real process: `process.stdin.once('end', () => transport.close())`
in `packages/mcp/src/server/stdio.ts` bridges Node's own EOF signal into
the transport's shutdown path. A raw spawn test that closes stdin and
asserts exit code 0 is what actually proves this, not the SDK-client test
that sits beside it — closing a client's own transport goes through a
different code path with a 2-second `SIGTERM` fallback that would mask the
bug.

## 2026-09-18 — the import-stubbing regex was quietly corrupting config field text

Caught by review, not by us: `rewriteStubImports` matched `import ... from
'....vue'` anywhere in a config file's source, including inside an
ordinary string literal — a field's own label text containing that exact
pattern (an example string meant for an agent to read) would be silently
rewritten to the stub module id, with no error. Reproduced it directly: a
label like `"e.g. import Hero from './Hero.vue'"` came back mutated.
Anchored the regex to the start of a line, which closes the reproduced case
— decoy text embedded mid-line, the shape any real field value takes, no
longer matches — but not the theoretical one, a multi-line template literal
whose *content* itself starts a line with real import syntax. A proper fix
needs a lexer, not a regex; the residual gap is documented in
`packages/mcp/src/loader/rewrite-stub-imports.ts` rather than claimed
closed.

## 2026-09-18 — jiti's `alias` can't stub by extension, and its `transform` hook has a real bug

The locked architecture called for loading a user's `gissen.config.ts` with
jiti, "with a resolver alias" mapping `.vue`/CSS/image imports to an inert
stub. A plain reading of jiti's `alias` option suggested it would do this;
empirically `alias` only does path-prefix rewriting, never extension
matching. The next attempt — adding `.vue` to jiti's `extensions` list with
a custom `transform` callback returning a stub for stub-extension files —
failed for a subtler reason: jiti decides whether a resolved file is ESM or
CommonJS from its extension *before* the custom transform ever runs, so a
`.vue` file rewritten to `export default {}` was still evaluated as
CommonJS and died on `Unexpected token 'export'`. What actually works:
rewrite the raw source's static import specifiers ending in a stub
extension to one synthetic module id, and resolve that id through jiti's
documented, exact-match `virtualModules` option
(`packages/mcp/src/loader/rewrite-stub-imports.ts`,
`create-config-jiti.ts`). Verified against jiti 2.7.0's real shipped
source, not its README.

## 2026-09-18 — `validateConfig` doesn't range-check `defaultProps`, but `validateData` does

Verified empirically before writing the guard: a config declaring
`defaultProps: { level: 99 }` against `max: 6` passes `validateConfig`
cleanly, and `createComponent` then produces a node whose own data instantly
fails `validateData` — so `add_component` could emit a tree its own config
rejects, on the very first call. Guarded at node creation
(`packages/mcp/src/document/create-node.ts`) with a new error naming the
config field responsible, not the caller's request. The same latent trap
exists in core's editor (`createComponent` is shared code) — recorded here
rather than fixed, out of scope for this phase.
