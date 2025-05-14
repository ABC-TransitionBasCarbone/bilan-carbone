import * as dbOrganization from '@/db/organization'
import * as dbUserImport from '@/db/userImport'
import * as orgUtils from '@/utils/organization'
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
jest.mock('../auth', () => ({ auth: jest.fn() }))

const mockGetUserByEmail = dbUserImport.getUserByEmail as jest.Mock
const mockGetOrganizationById = dbOrganization.getOrganizationById as jest.Mock
const mockCanEditOrganization = orgUtils.canEditOrganization as jest.Mock
const mockHasEditionRole = orgUtils.hasEditionRole as jest.Mock
const mockIsInOrgaOrParent = orgUtils.isInOrgaOrParent as jest.Mock
const mockGetOrganizationStudiesFromOtherUsers = studyFunctions.getOrganizationStudiesFromOtherUsers as jest.Mock
const mockAuth = authModule.auth as jest.Mock

describe('Organization permissions', () => {
  describe('isInOrgaOrParentFromId', () => {
    it('returns true if organization IDs match', async () => {
      const result = await isInOrgaOrParentFromId('mocked-organization-id', 'mocked-organization-id')
      expect(result).toBe(true)
    })

    it('returns true if organization is in parent chain', async () => {
      const mockedOrganizationId = 'mocked-organization-id'
      mockGetOrganizationById.mockResolvedValue({ id: mockedOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(true)

      const result = await isInOrgaOrParentFromId('user-organization-id', mockedOrganizationId)
      expect(result).toBe(true)
    })

    it('returns false if organization is not related', async () => {
      const mockedOrganizationId = 'mocked-organization-id'
      mockGetOrganizationById.mockResolvedValue({ id: mockedOrganizationId })
      mockIsInOrgaOrParent.mockReturnValue(false)

      const result = await isInOrgaOrParentFromId('user-organization-id', mockedOrganizationId)
      expect(result).toBe(false)
    })
  })

  describe('canCreateOrganization', () => {
    it('returns true if user belongs to CR organization', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockGetOrganizationById.mockResolvedValue({ isCR: true })

      const result = await canCreateOrganization({} as User)
      expect(result).toBe(true)
    })

    it('returns false if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null)

      const result = await canCreateOrganization({ email: 'mocked@email.com' } as User)
      expect(result).toBe(false)
    })

    it('returns false if organization is not CR', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockGetOrganizationById.mockResolvedValue({ isCR: false })

      const result = await canCreateOrganization({ email: 'mocked@email.com' } as User)
      expect(result).toBe(false)
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
    })

    it('returns false if user not found', async () => {
      mockGetUserByEmail.mockResolvedValue(null)

      const result = await canUpdateOrganization(
        { email: 'mocked@email.com', organizationId: 'mocked-user-organization-id' } as User,
        'mocked-organization-id',
      )
      expect(result).toBe(false)
    })

    it('returns false if organization check fails', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockIsInOrgaOrParent.mockResolvedValue(false)

      const result = await canUpdateOrganization(
        { email: 'mocked@email.com', organizationId: 'mocked-user-organization-id' } as User,
        'mocked-organization-id',
      )
      expect(result).toBe(false)
    })

    it('returns false if cannot edit organization', async () => {
      mockGetUserByEmail.mockResolvedValue({ organizationId: 'mocked-organization-id' })
      mockGetOrganizationById.mockResolvedValue({ id: 'mocked-organization-id' })
      mockIsInOrgaOrParent.mockResolvedValue(true)
      mockCanEditOrganization.mockReturnValue(false)

      const result = await canUpdateOrganization(
        { email: 'mocked@email.com', organizationId: 'mocked-user-organization-id' } as User,
        'mocked-organization-id',
      )
      expect(result).toBe(false)
    })
  })

  describe('canDeleteOrganization', () => {
    it('returns true if session user can edit and is parent organization', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-id', organizationId: 'mocked-organization-parent', role: Role.ADMIN },
      })
      mockGetOrganizationById.mockResolvedValue({ parentId: 'mocked-organization-parent' })
      mockHasEditionRole.mockReturnValue(true)
      mockGetOrganizationStudiesFromOtherUsers.mockResolvedValue(0)

      const result = await canDeleteOrganization('mocked-organization-child')
      expect(result).toBe(true)
    })

    it('returns false if no session or target organization', async () => {
      mockAuth.mockResolvedValue(null)
      const result = await canDeleteOrganization('mocked-organization-id')
      expect(result).toBe(false)
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
    })
  })
})
