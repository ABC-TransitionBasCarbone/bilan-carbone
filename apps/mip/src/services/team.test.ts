import { getAccountsMipForTeam } from '@/db/accountMip'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import { RoleMip, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import { getAccountMipFromUserOrganization } from './team'

jest.mock('@/db/accountMip', () => ({
  getAccountsMipForTeam: jest.fn(),
}))

const mockGetTeam = getAccountsMipForTeam as jest.Mock
const activeMember = { id: 'active', status: UserStatus.ACTIVE }
const pendingMember = { id: 'pending', status: UserStatus.PENDING_REQUEST }

describe('getAccountMipFromUserOrganization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTeam.mockImplementation(async (where) => (where.status ? [activeMember] : [activeMember, pendingMember]))
  })

  it('shows only active accounts to users who cannot edit member roles', async () => {
    const members = await getAccountMipFromUserOrganization(getMockedAuthUser({ role: RoleMip.COLLABORATOR }))
    expect(members).toEqual([activeMember])
    expect(mockGetTeam).toHaveBeenCalledWith({
      organizationVersionMipId: expect.any(String),
      status: UserStatus.ACTIVE,
    })
  })

  it('shows all organization accounts to users who can edit member roles', async () => {
    const members = await getAccountMipFromUserOrganization(getMockedAuthUser({ role: RoleMip.ADMIN }))
    expect(members).toEqual([activeMember, pendingMember])
    expect(mockGetTeam).toHaveBeenCalledWith({ organizationVersionMipId: expect.any(String) })
  })
})
