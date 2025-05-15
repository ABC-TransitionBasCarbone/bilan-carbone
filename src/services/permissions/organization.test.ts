import * as dbOrganization from '@/db/organization'
import * as dbUserImport from '@/db/userImport'
import { mockedOrganizationId } from '@/tests/utils/models/organization'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import * as organizationUtils from '@/utils/organization'
import { expect } from '@jest/globals'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import * as authModule from '../auth'
import * as studyFunctions from '../serverFunctions/study'
import {
  canCreateOrganization,
  canDeleteOrganization,
  canUpdateOrganization,
  isInOrgaOrParentFromId,
} from './organization'

jest.mock('@/db/userImport', () => ({ getUserByEmail: jest.fn() }))
jest.mock('@/db/organization', () => ({ getOrganizationById: jest.fn() }))
jest.mock('@/utils/organization', () => ({
  canEditOrganization: jest.fn(),
  hasEditionRole: jest.fn(),
  isInOrgaOrParent: jest.fn(),
}))
jest.mock('../serverFunctions/study', () => ({ getOrganizationStudiesFromOtherUsers: jest.fn() }))

// TODO : remove this mock. Should not be mocked but tests fail if not
jest.mock('../auth', () => ({ auth: jest.fn() }))

const mockGetUserByEmail = dbUserImport.getUserByEmail as jest.Mock
const mockGetOrganizationById = dbOrganization.getOrganizationById as jest.Mock
const mockCanEditOrganization = organizationUtils.canEditOrganization as jest.Mock
const mockHasEditionRole = organizationUtils.hasEditionRole as jest.Mock
const mockIsInOrgaOrParent = organizationUtils.isInOrgaOrParent as jest.Mock
const mockGetOrganizationStudiesFromOtherUsers = studyFunctions.getOrganizationStudiesFromOtherUsers as jest.Mock
const mockAuth = authModule.auth as jest.Mock

describe('Organization permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isInOrgaOrParentFromId', () => {
    it('returns true if organization IDs match', async () => {
      const result = await isInOrgaOrParentFromId('mocked-organization-id', 'mocked-organization-id')
      expect(result).toBe(true)
      expect(mockGetOrganizationById).toBeCalledTimes(0)
    })

    it('returns true if organization is in parent chain', async () => {
      const userOrganizationId = 'user-organization-id'
      mockGetOrganizationById.mockResolvedValue({ id: mockedOrganizationId, parentId: userOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(true)

      const result = await isInOrgaOrParentFromId(userOrganizationId, mockedOrganizationId)

      expect(result).toBe(true)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
    })

    it('returns false if organization is not related', async () => {
      const mockedOrganizationId = 'mocked-organization-id'
      mockGetOrganizationById.mockResolvedValue({ id: mockedOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(false)

      const result = await isInOrgaOrParentFromId('user-organization-id', mockedOrganizationId)

      expect(result).toBe(false)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
    })
  })

  describe('canCreateOrganization', () => {
    it('returns true if user belongs to CR organization', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockGetOrganizationById.mockResolvedValue({ isCR: true })

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(true)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
    })

    it('returns false if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null)

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(0)
    })

    it('returns false if organization is not found', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockGetOrganizationById.mockResolvedValue(null)

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
    })

    it('returns false if organization is not CR', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockGetOrganizationById.mockResolvedValue({ isCR: false })

      const result = await canCreateOrganization(getMockedAuthUser())
      expect(result).toBe(false)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
    })
  })

  describe('canUpdateOrganization', () => {
    it('returns true when user is from organization or parent and has editions rights', async () => {
      const mockedOrganizationId = 'mocked-organization-id'
      const user = { email: 'mocked@email.com', organizationId: mockedOrganizationId } as User
      mockGetUserByEmail.mockResolvedValue({ organizationId: mockedOrganizationId })
      mockGetOrganizationById.mockResolvedValue({ id: mockedOrganizationId })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockCanEditOrganization.mockReturnValue(true)

      const result = await canUpdateOrganization(user, mockedOrganizationId)
      expect(result).toBe(true)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(0)
      expect(mockCanEditOrganization).toBeCalledTimes(1)
    })

    it('returns false if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null)

      const result = await canUpdateOrganization(getMockedAuthUser(), mockedOrganizationId)
      expect(result).toBe(false)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(0)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(0)
      expect(mockCanEditOrganization).toBeCalledTimes(0)
    })

    it('returns false if organization check fails', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: mockedOrganizationId })
      mockIsInOrgaOrParent.mockResolvedValue(false)

      const result = await canUpdateOrganization(
        getMockedAuthUser({ organizationId: 'user-organization-id' }),
        mockedOrganizationId,
      )
      expect(result).toBe(false)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(1)
      expect(mockCanEditOrganization).toBeCalledTimes(0)
    })

    it('returns false if organization is not found', async () => {
      const mockedOrganizationChildId = 'mocked-organization-child-id'
      mockGetUserByEmail.mockResolvedValue({ organizationId: mockedOrganizationId })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockGetOrganizationById.mockImplementation((organizationId: string) => {
        if (organizationId === mockedOrganizationChildId) {
          return { parentId: mockedOrganizationId }
        } else {
          return null
        }
      })

      const result = await canUpdateOrganization(getMockedAuthUser(), mockedOrganizationChildId)
      expect(result).toBe(false)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(2)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(1)
      expect(mockCanEditOrganization).toBeCalledTimes(0)
    })

    it('returns false if cannot edit organization', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockGetOrganizationById.mockResolvedValue({ id: 'mocked-organization-id' })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockCanEditOrganization.mockReturnValue(false)

      const result = await canUpdateOrganization(getMockedAuthUser(), 'mocked-organization-id')
      expect(result).toBe(false)

      expect(mockGetUserByEmail).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockIsInOrgaOrParent).toBeCalledTimes(0)
      expect(mockCanEditOrganization).toBeCalledTimes(1)
    })
  })

  describe('canDeleteOrganization', () => {
    it('returns true if session user can edit and is parent organization', async () => {
      mockAuth.mockResolvedValue({ user: getMockedAuthUser({ organizationId: 'mocked-organization-parent' }) })
      mockGetOrganizationById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(0)

      const result = await canDeleteOrganization('mocked-organization-child')
      expect(result).toBe(true)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(1)
    })

    it('returns false if no session', async () => {
      mockAuth.mockResolvedValue(null)
      const result = await canDeleteOrganization('mocked-organization-id')
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(0)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(0)
    })

    it('returns false if no target', async () => {
      mockAuth.mockResolvedValue({ user: getMockedAuthUser() })
      mockGetOrganizationById.mockResolvedValue(null)
      const result = await canDeleteOrganization(mockedOrganizationId)
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(0)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(0)
    })

    it('returns false if user has no edition role', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationId: 'mocked-organization-parent', role: 'viewer' },
      })
      mockGetOrganizationById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(false)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(0)

      const result = await canDeleteOrganization('mocked-organization-child')
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(0)
    })

    it('returns false if studies from other users exists', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationId: 'mocked-organization-parent', role: 'viewer' },
      })
      mockGetOrganizationById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(1)

      const result = await canDeleteOrganization('mocked-organization-child')
      expect(result).toBe(false)
      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(1)
    })

    it('returns false if target organization is not a child of user organization', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationId: 'mocked-user-organization-id', role: Role.ADMIN },
      })
      mockGetOrganizationById.mockResolvedValue({ parentId: 'mocked-parent-organization-id' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(0)

      const result = await canDeleteOrganization('mocked-child-organization-id')
      expect(result).toBe(false)

      expect(mockAuth).toBeCalledTimes(1)
      expect(mockGetOrganizationById).toBeCalledTimes(1)
      expect(mockHasEditionRole).toBeCalledTimes(1)
      expect(mockGetOrganizationStudiesFromOtherUsers).toBeCalledTimes(1)
    })
  })
})
