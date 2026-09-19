import type { ServerContext } from '../../src/server/context'
import { chmod, readdir, stat } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { DuplicateComponentIdsError } from '../../src/document/errors'
import { DataParseError, DataValidationError, PostMutationValidationError } from '../../src/errors'
import { loadDocument, runMutation } from '../../src/server/document-pipeline'
import { testContext } from '../document/helpers'
import { createTempWorkspace } from '../helpers/temp-workspace'

function serverContext(dataPath: string): ServerContext {
  return { dataPath, document: testContext }
}

async function captureAsyncError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  }
  catch (error) {
    return error
  }
  throw new Error('Expected the promise to reject, but it resolved')
}

const emptyDoc = JSON.stringify({ version: 1, root: { props: {} }, content: [] })

describe('loadDocument', () => {
  it('reads the data file fresh on every call', async () => {
    const ws = await createTempWorkspace(emptyDoc)
    try {
      const ctx = serverContext(ws.dataPath)
      const first = await loadDocument(ctx)
      expect(first.content).toEqual([])

      await ws.seed(JSON.stringify({
        version: 1,
        root: { props: {} },
        content: [{ type: 'Hero', props: { id: 'h1', title: 'x' } }],
      }))
      const second = await loadDocument(ctx)
      expect(second.content).toHaveLength(1)
    }
    finally {
      await ws.cleanup()
    }
  })

  it('rejects a data file that is not valid JSON, naming the file', async () => {
    const ws = await createTempWorkspace('{ not json')
    try {
      const error = await captureAsyncError(loadDocument(serverContext(ws.dataPath)))
      expect(error).toBeInstanceOf(DataParseError)
      expect((error as DataParseError).dataPath).toBe(ws.dataPath)
    }
    finally {
      await ws.cleanup()
    }
  })

  it('rejects a data file that fails validateData against the loaded config', async () => {
    const ws = await createTempWorkspace(JSON.stringify({
      version: 1,
      root: { props: {} },
      content: [{ type: 'Hero', props: { id: 'h1', level: 99 } }],
    }))
    try {
      const error = await captureAsyncError(loadDocument(serverContext(ws.dataPath)))
      expect(error).toBeInstanceOf(DataValidationError)
      expect((error as DataValidationError).dataPath).toBe(ws.dataPath)
    }
    finally {
      await ws.cleanup()
    }
  })

  it('rejects a data file with duplicate component ids', async () => {
    const ws = await createTempWorkspace(JSON.stringify({
      version: 1,
      root: { props: {} },
      content: [
        { type: 'Hero', props: { id: 'dup', title: 'a' } },
        { type: 'Hero', props: { id: 'dup', title: 'b' } },
      ],
    }))
    try {
      await expect(loadDocument(serverContext(ws.dataPath))).rejects.toThrow(DuplicateComponentIdsError)
    }
    finally {
      await ws.cleanup()
    }
  })
})

describe('runMutation', () => {
  it('writes two-space-indented JSON with a trailing newline', async () => {
    const ws = await createTempWorkspace(emptyDoc)
    try {
      await runMutation(serverContext(ws.dataPath), data => ({
        data: { ...data, content: [{ type: 'Hero', props: { id: 'h1', title: 'x' } }] },
      }))
      const text = (await ws.readBytes()).toString('utf8')
      expect(text.endsWith('\n')).toBe(true)
      expect(text).toContain('  "version": 1')
      expect(text).toContain('    "id": "h1"')
    }
    finally {
      await ws.cleanup()
    }
  })

  it('preserves the data file\'s permission bits across a write, even bits the process umask would otherwise mask', async () => {
    const ws = await createTempWorkspace(emptyDoc)
    try {
      // 0o664 (group-writable) is deliberately chosen: under the common
      // 022 umask, a naive `open(path, 'wx', mode)` would silently narrow
      // this to 0o644 — the bug this test exists to catch. 0o640 (the
      // original mode here) doesn't catch it, since 022 doesn't touch it.
      await chmod(ws.dataPath, 0o664)
      await runMutation(serverContext(ws.dataPath), data => ({ data }))
      const mode = (await stat(ws.dataPath)).mode & 0o777
      expect(mode).toBe(0o664)
    }
    finally {
      await ws.cleanup()
    }
  })

  it('leaves no temporary file behind after a successful write', async () => {
    const ws = await createTempWorkspace(emptyDoc)
    try {
      await runMutation(serverContext(ws.dataPath), data => ({ data }))
      const entries = await readdir(ws.dir)
      expect(entries).toEqual(['page.json'])
    }
    finally {
      await ws.cleanup()
    }
  })

  it('does not write when the operation throws', async () => {
    const ws = await createTempWorkspace(emptyDoc)
    try {
      const before = await ws.readBytes()
      await expect(runMutation(serverContext(ws.dataPath), () => {
        throw new Error('boom')
      })).rejects.toThrow('boom')
      expect(await ws.readBytes()).toStrictEqual(before)
    }
    finally {
      await ws.cleanup()
    }
  })

  it('does not write when the operation\'s result fails validateData', async () => {
    const ws = await createTempWorkspace(emptyDoc)
    try {
      const before = await ws.readBytes()
      const error = await captureAsyncError(runMutation(serverContext(ws.dataPath), data => ({
        data: { ...data, content: [{ type: 'Hero', props: { id: 'h1', level: 99 } }] },
      })))
      expect(error).toBeInstanceOf(PostMutationValidationError)
      expect(await ws.readBytes()).toStrictEqual(before)
    }
    finally {
      await ws.cleanup()
    }
  })
})
