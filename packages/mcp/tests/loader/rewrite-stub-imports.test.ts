import { describe, expect, it } from 'vitest'
import { rewriteStubImports } from '../../src/loader/rewrite-stub-imports'
import { STUB_MODULE_ID } from '../../src/loader/stub-modules'

describe('rewriteStubImports', () => {
  it('rewrites a default-import specifier ending in a stub extension', () => {
    const out = rewriteStubImports(`import Hero from './Hero.vue'\n`)
    expect(out).toContain(`'${STUB_MODULE_ID}'`)
    expect(out).not.toContain('./Hero.vue')
  })

  it('rewrites a side-effect-only import (e.g. a stylesheet)', () => {
    const out = rewriteStubImports(`import './hero.css'\n`)
    expect(out).toContain(`'${STUB_MODULE_ID}'`)
  })

  it('leaves a non-stub import untouched', () => {
    const source = `import { defineGissenConfig } from 'gissen'\n`
    expect(rewriteStubImports(source)).toBe(source)
  })

  it('handles multiple imports, only rewriting the stub ones', () => {
    const source = [
      `import { defineGissenConfig } from 'gissen'`,
      `import Hero from './Hero.vue'`,
      `import './hero.css'`,
      `import Helper from './helper'`,
    ].join('\n')
    const out = rewriteStubImports(source)
    expect(out).toContain(`from 'gissen'`)
    expect(out).toContain(`from './helper'`)
    expect(out.match(new RegExp(STUB_MODULE_ID, 'g'))).toHaveLength(2)
  })

  it('handles a multi-line named import spanning several lines', () => {
    const source = `import {\n  Container,\n} from './Container.vue'\n`
    const out = rewriteStubImports(source)
    expect(out).toContain(`'${STUB_MODULE_ID}'`)
  })

  it('preserves double-quoted specifiers', () => {
    const out = rewriteStubImports(`import Hero from "./Hero.vue"\n`)
    expect(out).toContain(`"${STUB_MODULE_ID}"`)
  })

  // Regression for a real bug found in review: a config field's own text
  // (e.g. a `label` used as example text for an agent) can legitimately
  // contain something that *looks* like an import statement. Only a real,
  // line-starting import statement may be rewritten — text embedded inside
  // a string literal, wherever it sits on the line, must not be.
  it('does not rewrite import-like text inside a string literal', () => {
    const source = `const note = "import Foo from './Foo.vue'"\n`
    expect(rewriteStubImports(source)).toBe(source)
  })

  it('does not rewrite import-like text inside a config field value', () => {
    const source = `label: "e.g. import Hero from './Hero.vue'",\n`
    expect(rewriteStubImports(source)).toBe(source)
  })

  it('only rewrites the real import even when a decoy string precedes it on its own line', () => {
    const source = [
      `const note = "import Foo from './Foo.vue'"`,
      `import Hero from './Hero.vue'`,
    ].join('\n')
    const out = rewriteStubImports(source)
    expect(out).toContain(`"import Foo from './Foo.vue'"`) // decoy untouched
    expect(out.match(new RegExp(STUB_MODULE_ID, 'g'))).toHaveLength(1) // real import rewritten
  })
})
