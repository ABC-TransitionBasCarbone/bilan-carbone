import * as dbUser from '@/db/user'
import { mockedOrganizationVersionMipId } from '@/tests/utils/models/organization'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import * as userUtils from '@/utils/user'
import { expect } from '@jest/globals'
import * as authModule from '../auth'
import { canDeleteMember } from './organization'

jest.mock('@/db/accountMip', () => ({ getAccountMipById: jest.fn() }))
jest.mock('@/db/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('@/utils/user', () => ({
  canEditMemberRole: jest.fn(),
}))
jest.mock('../auth', () => ({ dbActualizedAuth: jest.fn() }))

const mockGetUserByEmail = dbUser.getUserByEmail as jest.Mock
const mockCanEditMemberRole = userUtils.canEditMemberRole as jest.Mock
const mockDBActualizedAuth = authModule.dbActualizedAuth as jest.Mock

describe('Organization permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('canDeleteMember', () => {
    it('returns false if no session', async () => {
      mockDBActualizedAuth.mockResolvedValue(null)

      const result = await canDeleteMember('mocked-user-email')
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(0)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(0)
    })

    it('returns false if user has no edition rights', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(false)

      const result = await canDeleteMember(mockedOrganizationVersionMipId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(0)
    })

    it('returns false if no user is found', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue(null)

      const result = await canDeleteMember(mockedOrganizationVersionMipId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })

    it('returns false if user tries to deleted its own account', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue({ accountsMip: [getMockedAuthUser()] })

      const result = await canDeleteMember(mockedOrganizationVersionMipId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })

    it('returns false if target user is not from user organization', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue({
        accountsMip: [
          {
            ...getMockedAuthUser(),
            userId: 'other-user-id',
            organizationVersionMipId: 'orther-organization-version-mip-id',
          },
        ],
      })

      const result = await canDeleteMember(mockedOrganizationVersionMipId)
      expect(result).toBe(false)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })

    it('returns true if user has rights and target is from same organization', async () => {
      mockDBActualizedAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockCanEditMemberRole.mockReturnValue(true)
      mockGetUserByEmail.mockResolvedValue({
        accountsMip: [{ ...getMockedAuthUser(), userId: 'other-user-id' }],
      })

      const result = await canDeleteMember(mockedOrganizationVersionMipId)
      expect(result).toBe(true)

      expect(mockDBActualizedAuth).toHaveBeenCalledTimes(1)
      expect(mockCanEditMemberRole).toHaveBeenCalledTimes(1)
      expect(mockGetUserByEmail).toHaveBeenCalledTimes(1)
    })
  })
})
