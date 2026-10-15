import { isBCEnvironment } from '@/services/permissions/environment'
import { getMockedAccount, getMockedAuthUser } from '@/tests/utils/models/user'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import { accountWithUserToUserSession } from './userAccounts'

describe('isBCEnvironment', () => {
  it.each(Object.values(Environment).filter((environment) => environment !== Environment.MIP))(
    'accepts %s',
    (environment) => {
      expect(isBCEnvironment(environment)).toBe(true)
    },
  )

  it.each([Environment.MIP, undefined, null, 'invalid', 42])('rejects %s', (environment) => {
    expect(isBCEnvironment(environment)).toBe(false)
  })
})

describe('accountWithUserToUserSession', () => {
  it('uses the organization environment when an organization exists', () => {
    const session = accountWithUserToUserSession({
      ...getMockedAccount({ environment: Environment.BC }),
      user: getMockedAuthUser(),
      organizationVersion: { organizationId: 'organization-id', environment: Environment.CUT },
    })

    expect(session.environment).toBe(Environment.CUT)
    expect(session.organizationId).toBe('organization-id')
  })

  it('uses the account environment when no organization exists', () => {
    const session = accountWithUserToUserSession({
      ...getMockedAccount({ environment: Environment.TILT, organizationVersionId: null }),
      user: getMockedAuthUser(),
      organizationVersion: null,
    })

    expect(session.environment).toBe(Environment.TILT)
    expect(session.organizationId).toBeNull()
    expect(session.organizationVersionId).toBeNull()
  })

  it('rejects a MIP account even if its organization has a BC environment', () => {
    expect(() =>
      accountWithUserToUserSession({
        ...getMockedAccount({ environment: Environment.MIP }),
        user: getMockedAuthUser(),
        organizationVersion: { organizationId: 'organization-id', environment: Environment.BC },
      }),
    ).toThrow('Invalid BC account environment')
  })

  it('rejects a MIP organization environment', () => {
    expect(() =>
      accountWithUserToUserSession({
        ...getMockedAccount(),
        user: getMockedAuthUser(),
        organizationVersion: { organizationId: 'organization-id', environment: Environment.MIP },
      }),
    ).toThrow('Invalid BC account environment')
  })
})
