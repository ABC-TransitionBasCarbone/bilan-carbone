import { getAccountsForTeam } from '@/db/account'
import { getMockedDbActualizedAuth } from '@/tests/utils/models/user'
import { Environment, Role, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import { getAccountFromUserOrganization } from './team'

jest.mock('@/db/account', () => ({
  getAccountsForTeam: jest.fn(),
}))

const mockGetTeam = getAccountsForTeam as jest.Mock
const activeMember = { id: 'active', status: UserStatus.ACTIVE }
const importedMember = { id: 'imported', status: UserStatus.IMPORTED }

describe('getAccountFromUserOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTeam.mockImplementation(async (where) => (where.status ? [activeMember] : [activeMember, importedMember]))
  })

  it('shows only active accounts to collaborators', async () => {
    const user = getMockedDbActualizedAuth({}, { environment: Environment.BC, role: Role.COLLABORATOR }).user
    const members = await getAccountFromUserOrganization(user)
    expect(members).toEqual([activeMember])
    expect(mockGetTeam).toHaveBeenCalledWith({
      organizationVersionId: user.organizationVersionId,
      status: UserStatus.ACTIVE,
    })
  })

  it('shows all accounts to organization managers', async () => {
    const user = getMockedDbActualizedAuth({}, { environment: Environment.BC, role: Role.GESTIONNAIRE }).user
    const members = await getAccountFromUserOrganization(user)
    expect(members).toEqual([activeMember, importedMember])
    expect(mockGetTeam).toHaveBeenCalledWith({ organizationVersionId: user.organizationVersionId })
  })
})
