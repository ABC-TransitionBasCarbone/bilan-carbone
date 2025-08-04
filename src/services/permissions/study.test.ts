import * as dbAccountModule from '@/db/account'
import * as dbStudyModule from '@/db/study'
import { mockedOrganizationVersionId } from '@/tests/utils/models/organization'
import { getMockedStudyCreateInput } from '@/tests/utils/models/study'
import { getMockedDbAccount, mockedAccountId, mockedSession, mockedUserId } from '@/tests/utils/models/user'
import * as studyUtils from '@/utils/study'
import { expect } from '@jest/globals'
import { Level, Role, StudyRole } from '@prisma/client'
import * as authModule from '../auth'
import * as organizationModule from './organization'
import { canCreateSpecificStudy, canDeleteStudy } from './study'

// mocked called function
jest.mock('@/db/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('@/db/study', () => ({ getStudyById: jest.fn() }))
jest.mock('@/db/account', () => ({ getAccountById: jest.fn() }))
jest.mock('@/utils/study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('./organization', () => ({ isInOrgaOrParentFromId: jest.fn() }))
jest.mock('../auth', () => ({ dbActualizedAuth: jest.fn() }))

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../serverFunctions/emissionFactor', () => ({ getEmissionFactorsByIds: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

const mockedStudyId = 'mocked-study-id'

const mockDBActualizedAuth = authModule.dbActualizedAuth as jest.Mock
const mockGetStudyById = dbStudyModule.getStudyById as jest.Mock
const mockGetAccountRoleOnStudy = studyUtils.getAccountRoleOnStudy as jest.Mock
const mockIsInOrgaOrParentFromId = organizationModule.isInOrgaOrParentFromId as jest.Mock
const mockGetAccountById = dbAccountModule.getAccountById as jest.Mock

const advancedStudy = getMockedStudyCreateInput({ level: Level.Advanced })
const standardStudy = getMockedStudyCreateInput({ level: Level.Standard })
const initialStudy = getMockedStudyCreateInput({ level: Level.Initial })

const mockedStudyToDelete = {
  id: mockedStudyId,
  organizationVersionId: mockedOrganizationVersionId,
  createdById: mockedAccountId,
  parentId: null,
  allowedUsers: [
    { account: { id: 'mocked-validator-id' }, role: 'Validator' },
    { account: { id: 'mocked-editor-id' }, role: 'Editor' },
    { account: { id: 'mocked-reader-id' }, role: 'Reader' },
  ],
  organization: { id: mockedOrganizationVersionId },
}

const getStudyWithPublicStatus = (isPublic: boolean) => ({ ...mockedStudyToDelete, isPublic })

describe('Study permissions service', () => {
  describe('canCreateSpecificStudy', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockIsInOrgaOrParentFromId.mockResolvedValue(true)
    })

    describe('"Advanced" level user', () => {
      beforeEach(() => {
        mockGetAccountById.mockResolvedValue(getMockedDbAccount({}, { level: Level.Advanced }))
      })

      it('User should be able to create an "Advanced" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, advancedStudy, mockedOrganizationVersionId)
        expect(result).toBe(true)
      })

      it('User should be able to create a "Standard" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, standardStudy, mockedOrganizationVersionId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, initialStudy, mockedOrganizationVersionId)
        expect(result).toBe(true)
      })
    })

    describe('"Standard" level user', () => {
      beforeEach(() => {
        mockGetAccountById.mockResolvedValue(getMockedDbAccount({}, { level: Level.Standard }))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, advancedStudy, mockedOrganizationVersionId)
        expect(result).toBe(false)
      })

      it('User should be able to create a "Standard" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, standardStudy, mockedOrganizationVersionId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, initialStudy, mockedOrganizationVersionId)
        expect(result).toBe(true)
      })
    })

    describe('"Initial" level user', () => {
      beforeEach(() => {
        mockGetAccountById.mockResolvedValue(getMockedDbAccount({}, { level: Level.Initial }))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, advancedStudy, mockedOrganizationVersionId)
        expect(result).toBe(false)
      })

      it('User should not be able to create a "Standard" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, standardStudy, mockedOrganizationVersionId)
        expect(result).toBe(false)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateSpecificStudy(mockedSession, initialStudy, mockedOrganizationVersionId)
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
      mockDBActualizedAuth.mockResolvedValue({
        user: { id: mockedUserId, accountId: mockedAccountId, organizationVersionId: mockedOrganizationVersionId },
      })
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Validator can delete study', async () => {
      mockGetStudyById.mockResolvedValue(mockedStudyToDelete)
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-random-account-id',
          id: 'mocked-random-user-id',
          organizationVersionId: mockedOrganizationVersionId,
          email: 'mocked-validator-email',
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Editor cannot delete study', async () => {
      mockGetStudyById.mockResolvedValue(mockedStudyToDelete)
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-random-acount-id',
          id: 'mocked-random-user-id',
          organizationVersionId: mockedOrganizationVersionId,
          email: 'mocked-editor-email',
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Editor)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Reader cannot delete study', async () => {
      mockGetStudyById.mockResolvedValue(mockedStudyToDelete)
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-random-account-id',
          id: 'mocked-random-user-id',
          organizationVersionId: mockedOrganizationVersionId,
          email: 'mocked-editor-reader',
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Reader)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Organization Admin can delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-account-admin-id',
          id: 'mocked-user-admin-id',
          organizationVersionId: mockedOrganizationVersionId,
          role: Role.ADMIN,
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Organization Super-Admin can delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-account-super-admin-id',
          id: 'mocked-user-super-admin-id',
          organizationVersionId: mockedOrganizationVersionId,
          role: Role.SUPER_ADMIN,
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Organization gestionnaire cannot delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-gestionnaire-user-id',
          id: 'mocked-gestionnaire-user-id',
          organizationVersionId: mockedOrganizationVersionId,
          role: 'GESTIONNAIRE',
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Reader)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Organization default cannot delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-default-account-id',
          id: 'mocked-default-user-id',
          organizationVersionId: mockedOrganizationVersionId,
          role: 'COLLABORATOR',
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Reader)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Organization Admin can delete private study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(false))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-account-admin-id',
          id: 'mocked-user-admin-id',
          organizationVersionId: mockedOrganizationVersionId,
          role: Role.ADMIN,
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Organization Super-Admin can delete private study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(false))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-account-super-admin-id',
          id: 'mocked-user-super-admin-id',
          organizationVersionId: mockedOrganizationVersionId,
          role: Role.SUPER_ADMIN,
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(true)
    })

    it('Other organization user cannot delete public study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(true))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-other-organization-account-id',
          id: 'mocked-other-organization-super-admin-user-id',
          organizationVersionId: 'mocked-other-organization-id',
          role: Role.SUPER_ADMIN,
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(null)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })

    it('Other organization user cannot delete private study', async () => {
      mockGetStudyById.mockResolvedValue(getStudyWithPublicStatus(false))
      mockDBActualizedAuth.mockResolvedValue({
        user: {
          accountId: 'mocked-other-organization-account-id',
          id: 'mocked-other-organization-super-admin-user-id',
          organizationVersionId: 'mocked-other-organization-id',
          role: Role.SUPER_ADMIN,
        },
      })
      mockGetAccountRoleOnStudy.mockReturnValue(null)
      const result = await canDeleteStudy(mockedStudyId)
      expect(result).toBe(false)
    })
  })
})
