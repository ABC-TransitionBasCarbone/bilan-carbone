import * as dbStudyModule from '@/db/study'
import * as dbUserModule from '@/db/userImport'
import { getMockedDbUser, getMockedStudy, mockedOrganizationId } from '@/tests/utils/models'
import * as studyUtils from '@/utils/study'
import { expect } from '@jest/globals'
import { Level, Role, StudyRole } from '@prisma/client'
import * as authModule from '../auth'
import * as organizationModule from './organization'
import { canCreateStudy, canDeleteStudy } from './study'

// mocked called function
jest.mock('@/db/userImport', () => ({ getUserByEmail: jest.fn() }))
jest.mock('@/db/study', () => ({ getStudyById: jest.fn() }))
jest.mock('@/utils/study', () => ({ getUserRoleOnStudy: jest.fn() }))
jest.mock('./organization', () => ({ isInOrgaOrParentFromId: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../serverFunctions/emissionFactor', () => ({ getEmissionFactorsByIds: jest.fn() }))

const mockedUserId = 'mocked-user-id'
const mockedStudyId = 'mocked-study-id'

const mockAuth = authModule.auth as jest.Mock
const mockGetStudyById = dbStudyModule.getStudyById as jest.Mock
const mockGetUserRoleOnStudy = studyUtils.getUserRoleOnStudy as jest.Mock
const mockGetUserByEmail = dbUserModule.getUserByEmail as jest.Mock
const mockIsInOrgaOrParentFromId = organizationModule.isInOrgaOrParentFromId as jest.Mock

const advancedStudy = getMockedStudy({ level: Level.Advanced })
const standardStudy = getMockedStudy({ level: Level.Standard })
const initialStudy = getMockedStudy({ level: Level.Initial })

const mockedStudyToDelete = {
  id: mockedStudyId,
  organizationId: mockedOrganizationId,
  createdById: mockedUserId,
  allowedUsers: [
    { user: { email: 'mocked-validator-email' }, role: 'Validator' },
    { user: { email: 'mocked-editor-email' }, role: 'Editor' },
    { user: { email: 'mocked-reader-email' }, role: 'Reader' },
  ],
  organization: { id: mockedOrganizationId, parentId: null },
}

const getStudyWithPublicStatus = (isPublic: boolean) => ({ ...mockedStudyToDelete, isPublic })

describe('Study permissions service', () => {
  describe('canCreateStudy', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockIsInOrgaOrParentFromId.mockResolvedValue(true)
    })

    describe('"Advanced" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedDbUser({ level: Level.Advanced }))
      })

      it('User should be able to create an "Advanced" study', async () => {
        const result = await canCreateStudy('mocked-email', advancedStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create a "Standard" study', async () => {
        const result = await canCreateStudy('mocked-email', standardStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateStudy('mocked-email', initialStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })

    describe('"Standard" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedDbUser({ level: Level.Standard }))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const result = await canCreateStudy('mocked-email', advancedStudy, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should be able to create a "Standard" study', async () => {
        const result = await canCreateStudy('mocked-email', standardStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateStudy('mocked-email', initialStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })

    describe('"Initial" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedDbUser({ level: Level.Initial }))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const result = await canCreateStudy('mocked-email', advancedStudy, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should not be able to create a "Standard" study', async () => {
        const result = await canCreateStudy('mocked-email', standardStudy, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateStudy('mocked-email', initialStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })
  })

  describe('canDeleteStudy', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('Creator can delete its study', async () => {
      mockGetStudyById.mockResolvedValue(mockedStudyToDelete)
      mockAuth.mockResolvedValue({ user: { id: mockedUserId, organizationId: mockedOrganizationId } })
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Validator can delete study', async () => {
      mockGetStudyById.mockResolvedValue(mockedStudyToDelete)
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-random-user-id', organizationId: mockedOrganizationId, email: 'mocked-validator-email' },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Editor cannot delete study', async () => {
      mockGetStudyById.mockResolvedValue(mockedStudyToDelete)
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-random-user-id', organizationId: mockedOrganizationId, email: 'mocked-editor-email' },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Editor)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Reader cannot delete study', async () => {
      mockGetStudyById.mockResolvedValue(mockedStudyToDelete)
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-random-user-id', organizationId: mockedOrganizationId, email: 'mocked-editor-reader' },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Reader)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Organization Admin can delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-admin-id', organizationId: mockedOrganizationId, role: Role.ADMIN },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Organization Super-Admin can delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-super-admin-id', organizationId: mockedOrganizationId, role: Role.SUPER_ADMIN },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Organization gestionnaire cannot delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockAuth.mockResolvedValue({
        user: {
          id: 'mocked-gestionnaire-user-id',
          organizationId: mockedOrganizationId,
          role: 'GESTIONNAIRE',
        },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Reader)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Organization default cannot delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockAuth.mockResolvedValue({
        user: {
          id: 'mocked-default-user-id',
          organizationId: mockedOrganizationId,
          role: 'COLLABORATOR',
        },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Reader)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Organization Admin can delete private study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(false))
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-admin-id', organizationId: mockedOrganizationId, role: Role.ADMIN },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Organization Super-Admin can delete private study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(false))
      mockAuth.mockResolvedValue({
        user: { id: 'mocked-user-super-admin-id', organizationId: mockedOrganizationId, role: Role.SUPER_ADMIN },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Other organization user cannot delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockAuth.mockResolvedValue({
        user: {
          id: 'mocked-other-organization-super-admin-user-id',
          organizationId: 'mocked-other-organization-id',
          role: Role.SUPER_ADMIN,
        },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(null)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Other organization user cannot delete private study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(false))
      mockAuth.mockResolvedValue({
        user: {
          id: 'mocked-other-organization-super-admin-user-id',
          organizationId: 'mocked-other-organization-id',
          role: Role.SUPER_ADMIN,
        },
      })
      mockGetUserRoleOnStudy.mockResolvedValue(null)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })
  })
})
