import { describe, expect, it } from 'vitest'
import { plateFingerprint } from './identity'

describe('plateFingerprint', () => {
  it('normalizes case, spaces, and punctuation', () => {
    expect(plateFingerprint('LEA-2046')).toBe(plateFingerprint(' lea 2046 '))
  })
  it('does not expose the plate in the stored fingerprint', () => {
    expect(plateFingerprint('KBL-5821')).not.toContain('KBL5821')
  })
})
