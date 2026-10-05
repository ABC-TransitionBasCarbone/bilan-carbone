import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import { canUpdateOrganizationSiret } from './organization.command'

describe('canUpdateOrganizationSiret', () => {
  it('allows changing the SIRET for a client organization', () => {
    expect(canUpdateOrganizationSiret(Environment.BC, 'parent-id')).toBe(true)
  })

  it('does not allow changing the SIRET for a top-level organization', () => {
    expect(canUpdateOrganizationSiret(Environment.BC, null)).toBe(false)
  })

  Object.values(Environment)
    .filter((env) => env !== Environment.BC)
    .forEach((env) => {
      it('allows all for other environments', () => {
        expect(canUpdateOrganizationSiret(env, 'parent-id')).toBe(true)
        expect(canUpdateOrganizationSiret(env, null)).toBe(true)
      })
    })
})
