import { expect } from '@jest/globals'
import { canUpdateOrganizationSiret } from './organization.command'

describe('canUpdateOrganizationSiret', () => {
  it('allows changing the SIRET for a client organization', () => {
    expect(canUpdateOrganizationSiret('parent-id', '12345678901234', '43210987654321')).toBe(true)
  })

  it('does not allow changing the SIRET for a top-level organization', () => {
    expect(canUpdateOrganizationSiret(null, '12345678901234', '43210987654321')).toBe(false)
  })

  it('allows an unchanged SIRET for a top-level organization', () => {
    expect(canUpdateOrganizationSiret(null, '12345678901234', '12345678901234')).toBe(true)
    expect(canUpdateOrganizationSiret(null, null, '')).toBe(true)
    expect(canUpdateOrganizationSiret(null, '', '')).toBe(true)
    expect(canUpdateOrganizationSiret(null, '12345678901234', undefined)).toBe(true)
  })
})
