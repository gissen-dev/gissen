# Phase 8: documentation, examples, playground

Entries are grouped by sub-phase. Each one is a thing that cost time or changed a decision.

## A and B: the docs site

**The docs were never deployed.** The VitePress site built in CI and went nowhere. gissen.dev answered with a placeholder from a separate repository (`gissen-dev/landing`, Cloudflare Workers with a single-page-app fallback, so every path returned 200, including `/config-api`, which does not exist there). Checking with `curl` is what showed it; nothing in this repository mentioned it. The deploy trigger is still undecided and was kept out of this phase on purpose.

**Hand-typed code with a mirror copy.** The old pages typed every code block into the markdown and kept a second copy in `snippets/*.ts` that was type-checked. The two could differ and nothing compared them. The replacement is stricter: pages import code from real files, and a test fails on any fenced block that is not `sh` or JSON. It also fails on an import of a file or region that does not exist, which VitePress renders as an inline error instead of failing the build.

**API coverage is read from the built output.** The test lists exports with the TypeScript compiler API over `dist/index.d.ts` and `dist/render.d.ts`, because the published declarations are what a consumer sees, not `src`. CSS variables come from `gissen.css`, flags from the real `--help`, and the tools by starting the real server and asking `tools/list`. A first mutation check passed when it should have failed, because the replacement string did not match anything in the file. The fix was to run each mutation, read the failure message, and only then trust the test.

**Quickstart layout.** The first version put the editor and the preview side by side. A screenshot showed the canvas squeezed to about 140px, because the editor's two panels take 560px. The layout is now stacked. The DOM alone would not have shown it.

**create-vite asks questions.** The quickstart has to work from a script and from a terminal. `--no-interactive` is the flag that makes the command identical in both.

**Documenting the API found things the code did not say.** A component must declare an `id` prop or `defineGissenConfig` rejects it. `gissen/render` has no `validateData`, although the guide tells render-only apps to validate. `validateData` accepts duplicate ids and `gissen-mcp` rejects them. `GissenValidationError.issues` is zod's type. `createComponent` throws a plain `Error`. The MCP server announced version `0.0.0` in the handshake, which a real `initialize` call confirmed; that one was fixed, with a test against the built CLI. The rest are in `AUDIT_BACKLOG.md`.

**A documented variable is a commitment.** The coverage test forced every `--gissen-*` variable into the reference, including `--gissen-chrome-height`, which is a layout detail. The decision was to keep it out and give the test an explicit list of internal variables, with a check that the list does not go stale. Six variables were documented only because the test demanded it, and are flagged in the backlog for the same review.

## C: examples and the MCP guide

**Nitro cannot build a `.vue` import.** A server route that imports `gissen.config.ts` fails the Nitro build, because Nitro bundles `server/` with its own Rollup pipeline and no Vue plugin. The config mixes field schema, which a server needs, with render components, which it cannot load. `nuxt-ssr` splits the two by hand (`schema.ts`) so its PUT route can call `validateData`. This is a workaround and is labelled as one on the page, in the README and in the backlog.

**npm outside a workspace picks different versions.** Installed alone, `nuxt-ssr` resolved TypeScript 7.0.2, and `vue-tsc` crashed on `./lib/tsc`, which TypeScript 7 does not export. Inside the workspace the root pin had hidden this. The example now pins its own `typescript`.

**`pnpm pack` and `npm pack` print different things.** `npm pack` prints a file name and `pnpm pack` prints a full path. The examples check prepended a directory to the second and produced a path that did not exist. `scripts/consumer-probe` already had a comment about exactly this difference.

**The editor and the renderer disagree about slot wrappers.** `layouts-and-slots` laid out two columns correctly in `GissenRender` and stacked them in the editor, because in the editor a slot's direct child is the editor's own `.gissen-slot` wrapper. The Editor guide, written in the previous sub-phase, told readers not to style through those wrappers. Both guides were corrected.

**The catalogue's first mutation check was also a false pass.** The sed pattern assumed the message and its "The page was not changed." suffix were one string. They are joined at runtime. Separately, a path normaliser used one placeholder for two different paths and wrote `/path/to/page.json/does-not-exist.ts` into four snapshots. Both were found by reading the output, not by the tests.

**The weekly check had never run on CI's npm.** CI pins Node 20, whose bundled npm crashed with `Cannot read properties of null (reading 'edgesOut')` on a plain `npm install` of the create-vite template. Locally there was only Node 24. An `npm install -g npm@latest` step was added. It has not been confirmed on CI at the time of writing.

**HMR in `mcp-agent`.** `page-store.ts` accepts its own update, so Vite re-runs the module instead of reloading, and the new value is copied into the ref that the component already holds. The check put a marker on `window`, made two real MCP tool calls, and confirmed the marker survived and the text changed. The agent in that check was an SDK client, not a language model, and the README says so.

## D: playground, landing, Why Gissen

**Two copies of the editor.** The first playground rendered the editor but every slot was empty. The console said `useEditorStore() was called outside of a <GissenEditor> context`. The store key is a module-level `Symbol`, and the canvas loads `CanvasSlot` lazily. VitePress builds two chunks per page, and a static import put the editor into both, so the lazy chunk looked for the store in the other copy. A custom `manualChunks` would not have helped, because VitePress places its own after the user's. The playground now imports the editor dynamically, which gives both page chunks one shared copy. The same example built with Vite 8 worked, which is what pointed at the bundler. The library side is in the backlog.

**The phone problem has no good answer in the editor yet.** The editor needs about 960px. The playground uses tabs and puts the editor in a frame that scrolls sideways, opens on Preview on small screens, and says so in one line. Shrinking the panels through CSS variables was rejected, since those variables are about to be split into public and internal ones.

**Clipboard in a test browser.** Headless Chrome reports the document as unfocused, so `navigator.clipboard.writeText` rejects. Verifying Copy JSON needed focus emulation for the main path, and an instrumented `execCommand` to see what the fallback would copy. Both were checked, and the selected text equals the JSON tab.

**A hidden page is not a safe page.** Why Gissen is a draft. Leaving it out of the navigation would still publish it with the next site deploy. It is excluded from the build unless `DOCS_DRAFTS=1`, and a test keeps it out of the navigation, the search and every link.

**Demo video slots.** The site looks for `public/demo/editor.*` and `agent.*` at build time and shows a video, or a screenshot of the real playground, or nothing. The encoder was run on a generated clip with audio, and the output was checked for codec, size, pixel format and absence of audio. No real recording was committed.

**Link checking needed its own script.** VitePress fails the build on a dead page link and does not look at anchors or assets. A short Node script walks the built HTML (513 references across 14 pages). It caught a deliberately broken anchor and a deleted screenshot in mutation checks.

**The old README made a claim and linked a video.** It called Gissen "the Vue equivalent of" another project, and its demo video predates the renderer and the MCP server. Both are gone. The other project is now mentioned in one fixed sentence, and a test fails on parity wording.
