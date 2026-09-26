# Phase 7 — MCP server (`gissen-mcp`)

## 2026-09-26 — the defaultProps guard didn't catch its own null case

Two independent review agents, working separately, both flagged the same
gap in the guard added on 2026-09-18: `createNode` re-runs
`resolveFieldValue` on each of a config's `defaultProps` specifically to
catch an invalid default before a node is created, but `resolveFieldValue`
treats a literal `null` as the agent-facing "clear this field" signal for
`update_component` — for `null` it *resolves* a value (`''` or `undefined`)
rather than throwing. The guard only caught thrown exceptions and discarded
the resolved value either way, so `defaultProps: { title: null }` on a text
field produced neither an error nor a normalized value: the node kept the
literal `null`, `add_component` reported success, and only the later
post-mutation `validateData` check rejected it — with the wrong, generic
"this is a bug in gissen-mcp, please report it" wording instead of the
guard's own config-blaming `InvalidDefaultPropError`. No data was ever
written either way; only the error message misattributed the fault.
Reproduced directly before fixing: a scratch config with that exact default
confirmed `addComponent` didn't throw, `node.props.title` stayed a literal
`null`, and `validateData` rejected it downstream. Fixed by checking `null`
before calling `resolveFieldValue` at all, rather than folding it into the
same try/catch (`packages/mcp/src/document/create-node.ts`) — deliberately
rejecting rather than normalizing, so `null`'s meaning doesn't quietly
depend on whether it showed up in `defaultProps` or in an agent's edit.

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
rather than fixed, out of scope for this phase — see the 2026-09-26 update
below.

**2026-09-26 update — fixed at the source.** `validateConfig` now rejects a
*non-slot* `defaultProps` entry that violates its own field's type, number
`min`/`max`/finiteness, or select `options`, plus a `defaultProps` key with
no matching field, a literal `null` on a non-slot field, and the reserved
`id` key (`packages/core/src/validation/config-schemas.ts`). (Slot-field
`defaultProps` — including a literal `null` there — is untouched by this fix;
see the `AUDIT_BACKLOG.md` reference below.) The range/type/option rules are
not duplicated: `validateData`'s per-field checks were extracted into a
shared `validateScalarFieldValue`
(`packages/core/src/validation/field-value-rules.ts`), used by both
`validateData` (live props) and `validateConfig` (`defaultProps`), so the two
can't drift apart. `null` and non-finite-number rejection stay local to
`validateConfig` instead of moving into the shared function, since neither
applies to `validateData`'s live-prop checks the same way. This closes the
trap for the editor too, since `createComponent` is shared code and every
config now goes through the fixed `validateConfig` before a node is ever
built.

Consequently, `gissen-mcp`'s own `InvalidDefaultPropError` guard in
`createNode` — added earlier the same day, in the entry above, as a
gissen-mcp-only workaround — became unreachable: `run()` loads and validates
the config before any node is ever created, so a config with this defect now
fails at server startup with a `validateConfig` error that names the
component and field at least as specifically as the guard's own message did
(and, for select/number violations, more specifically — it states the
allowed range or options, not just "is out of range"). The guard, its error
class, and its now-dead tests were removed. Slot-field `defaultProps` stays
unvalidated by this fix — see `AUDIT_BACKLOG.md` ("MEDIUM (deferred —
whole-config / whole-document structural checks)").
