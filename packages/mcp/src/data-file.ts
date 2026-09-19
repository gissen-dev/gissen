import type { GissenData } from 'gissen'
import { randomUUID } from 'node:crypto'
import { access, constants, open, readFile, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { DataFileError, DataParseError, DataWriteError } from './errors'

/**
 * Confirms the data file exists and is readable. Does not parse or validate
 * its contents as `GissenData` — a malformed data file is better reported as
 * an actionable tool error (see `loadDocument`) than as a dead process with
 * nothing listening. This check only guards against a flatly wrong `--data`
 * path at startup.
 */
export async function assertDataFileReadable(dataPath: string): Promise<void> {
  try {
    await access(dataPath, constants.R_OK)
  }
  catch (cause) {
    throw new DataFileError(dataPath, cause)
  }
}

/** Reads and parses the data file fresh. Does not validate its shape — see `loadDocument`. */
export async function readDataFile(dataPath: string): Promise<unknown> {
  let raw: string
  try {
    raw = await readFile(dataPath, 'utf8')
  }
  catch (cause) {
    throw new DataFileError(dataPath, cause)
  }
  try {
    return JSON.parse(raw)
  }
  catch (cause) {
    throw new DataParseError(dataPath, cause)
  }
}

/**
 * The single serialization of a page tree. Deterministic on purpose: the
 * byte-identity guarantee for a rejected mutation, and any diff a human
 * reads, both depend on this never varying. Two-space indent matches every
 * JSON file already in this repo; the trailing newline is POSIX-conventional
 * and keeps a plain read of the file from ending "\ No newline at end of
 * file" in a diff. `JSON.stringify` drops `undefined` values — that is
 * exactly how a `null`-clear (see `resolveFieldValue`) round-trips to an
 * absent key, which `validateData` tolerates by design.
 */
export function serializeData(data: GissenData): string {
  return `${JSON.stringify(data, null, 2)}\n`
}

/**
 * Writes `contents` to `dataPath` atomically: write to a temp file in the
 * SAME directory (an OS rename is only atomic within one filesystem — a temp
 * file elsewhere, e.g. `os.tmpdir()`, would degrade this to a non-atomic
 * copy across devices), fsync it, then rename over the target. A crash or
 * concurrent read can only ever observe the old complete file or the new
 * complete file, never a partial write.
 *
 * Note this only guards the CONTENTS: `rename(2)` doesn't check the
 * target's own permission bits at all (only write+execute on the
 * containing directory), so a data file the user marked `chmod 444` is
 * still replaced by a mutation — the read-only bit is not a write-lock.
 *
 * The temp name is dot-prefixed (so a `*.json` glob — a watcher, a build
 * step, the user's own editor — never picks up a half-written page) and
 * carries a random suffix opened with the exclusive `'wx'` flag (so two
 * `gissen-mcp` processes writing the same file can't collide). The
 * target's existing permission bits are read and re-applied with an
 * explicit `chmod` after opening — NOT via `open()`'s own `mode` argument,
 * which the process umask silently masks (e.g. a deliberately
 * group-writable `0o664` file becomes `0o644` under the common `022`
 * umask); `chmod`/`fchmod` set the exact bits requested, umask does not
 * apply to them. Without this, a mutation would silently narrow a file's
 * permissions instead of preserving them.
 */
export async function writeDataFileAtomically(dataPath: string, contents: string): Promise<void> {
  const dir = path.dirname(dataPath)
  const tmpPath = path.join(dir, `.${path.basename(dataPath)}.${randomUUID()}.tmp`)

  let mode: number | undefined
  try {
    mode = (await stat(dataPath)).mode & 0o777
  }
  catch {
    // Target doesn't exist yet (or isn't stat-able) — fall back to the
    // process umask rather than failing the write over a cosmetic detail.
    mode = undefined
  }

  try {
    const handle = await open(tmpPath, 'wx')
    try {
      if (mode !== undefined)
        await handle.chmod(mode)
      await handle.writeFile(contents, 'utf8')
      await handle.sync()
    }
    finally {
      await handle.close()
    }
    await rename(tmpPath, dataPath)
  }
  catch (cause) {
    await rm(tmpPath, { force: true })
    throw new DataWriteError(dataPath, hideTempPath(cause, tmpPath, dataPath))
  }
}

/**
 * A write failure's underlying Node error typically embeds the literal
 * path it was operating on — for most of this function's failure modes,
 * that's `tmpPath`, an internal detail (a dot-prefixed, UUID-suffixed
 * filename) the agent never asked about and shouldn't need to parse
 * around. Rewrites it to the real `dataPath` so the message stays
 * accurate without leaking an implementation detail.
 */
function hideTempPath(cause: unknown, tmpPath: string, dataPath: string): unknown {
  if (cause instanceof Error && cause.message.includes(tmpPath)) {
    const rewritten = new Error(cause.message.split(tmpPath).join(dataPath), { cause })
    rewritten.name = cause.name
    return rewritten
  }
  return cause
}
