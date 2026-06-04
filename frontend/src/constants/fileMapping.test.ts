// frontend/src/constants/fileMapping.test.ts
import { describe, it, expect } from 'vitest'
import { CHARACTER_FILES, ACCOUNT_FILES, ALL_CHARACTER_FILENAMES } from './fileMapping'

describe('fileMapping', () => {
  it('CHARACTER_FILES has 10 entries', () => {
    expect(CHARACTER_FILES).toHaveLength(10)
  })
  it('ACCOUNT_FILES has 1 entry', () => {
    expect(ACCOUNT_FILES).toHaveLength(1)
    expect(ACCOUNT_FILES[0].filename).toBe('MACROSYS.DAT')
  })
  it('ALL_CHARACTER_FILENAMES includes CONTROL0 and CONTROL1 separately', () => {
    expect(ALL_CHARACTER_FILENAMES).toContain('CONTROL0.DAT')
    expect(ALL_CHARACTER_FILENAMES).toContain('CONTROL1.DAT')
  })
})
