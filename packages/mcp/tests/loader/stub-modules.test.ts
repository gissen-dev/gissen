import { describe, expect, it } from 'vitest'
import { isStubSpecifier, STUB_EXTENSIONS } from '../../src/loader/stub-modules'

describe('isStubSpecifier', () => {
  it.each(STUB_EXTENSIONS)('matches a %s specifier', (ext) => {
    expect(isStubSpecifier(`./components/Hero${ext}`)).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isStubSpecifier('./components/Hero.VUE')).toBe(true)
    expect(isStubSpecifier('./icons/logo.PNG')).toBe(true)
  })

  it('does not match a non-stub extension', () => {
    expect(isStubSpecifier('./components/Hero.ts')).toBe(false)
    expect(isStubSpecifier('gissen')).toBe(false)
  })

  // Query-suffixed specifiers (e.g. `Foo.vue?raw`, common in Vite-oriented
  // codebases) are out of scope for Phase A: a Gissen config's own component
  // imports don't need raw-source loading, and adding suffix-stripping now
  // would be speculative given no such config exists yet.
  it.todo('query-suffixed specifiers are not currently handled')
})
