import * as dbAccountModule from '@/db/account'
import * as dbOrganizationModule from '@/db/organization'
import * as dbStudyModule from '@/db/study'
import { mockedOrganizationVersionId } from '@/tests/utils/models/organization'
import { getMockedFullStudy, getMockedStudyCreateInput } from '@/tests/utils/models/study'
import {
  getMockedDbAccount,
  getMockedDbActualizedAuth,
  mockedAccountId,
  mockedSession,
  mockedUserId,
} from '@/tests/utils/models/user'
import * as organizationUtils from '@/utils/organization'
import * as studyUtils from '@/utils/study'
import { expect } from '@jest/globals'
import { Environment, Level, Role, StudyRole } from '@prisma/client'
import * as authModule from '../auth'
import * as userModule from '../serverFunctions/user'
import * as environmentModule from './environment'
import * as organizationModule from './organization'
import { canCreateSpecificStudy, canDeleteStudy, canDuplicateStudy, getEnvironmentsForDuplication } from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('uuid', () => ({ v4: jest.fn() }))

// mocked called function
jest.mock('@/db/account', () => ({ getAccountById: jest.fn() }))
jest.mock('@/db/organization', () => ({
  getOrganizationVersionsByOrganizationId: jest.fn(),
  getOrganizationVersionById: jest.fn(),
}))
jest.mock('@/db/study', () => ({ getStudyById: jest.fn() }))
jest.mock('@/db/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('@/utils/study', () => ({ getAccountRoleOnStudy: jest.fn(), getDuplicableEnvironments: jest.fn() }))
jest.mock('@/utils/organization', () => ({ canEditOrganizationVersion: jest.fn(), hasActiveLicence: jest.fn() }))
jest.mock('./organization', () => ({ isInOrgaOrParentFromId: jest.fn() }))
jest.mock('./environment', () => ({ hasAccessToDuplicateStudy: jest.fn() }))
jest.mock('../auth', () => ({ dbActualizedAuth: jest.fn() }))
jest.mock('../serverFunctions/user', () => ({ getUserActiveAccounts: jest.fn() }))

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../serverFunctions/emissionFactor', () => ({ getEmissionFactorsByIds: jest.fn() }))
jest.mock('next-intl/server', () => ({ getTranslations: jest.fn(() => (key: string) => key) }))

const mockedStudyId = 'mocked-study-id'

const mockDBActualizedAuth = authModule.dbActualizedAuth as jest.Mock
const mockGetUserActiveAccounts = userModule.getUserActiveAccounts as jest.Mock
const mockGetStudyById = dbStudyModule.getStudyById as jest.Mock
const mockGetAccountRoleOnStudy = studyUtils.getAccountRoleOnStudy as jest.Mock
const mockGetDuplicableEnvironments = studyUtils.getDuplicableEnvironments as jest.Mock
const mockCanEditOrganizationVersion = organizationUtils.canEditOrganizationVersion as jest.Mock
const mockHasActiveLicence = organizationUtils.hasActiveLicence as jest.Mock
const mockIsInOrgaOrParentFromId = organizationModule.isInOrgaOrParentFromId as jest.Mock
const mockHasAccessToDuplicateStudy = environmentModule.hasAccessToDuplicateStudy as jest.Mock
const mockGetAccountById = dbAccountModule.getAccountById as jest.Mock
const mockGetOrganizationVersionsByOrganizationId =
  dbOrganizationModule.getOrganizationVersionsByOrganizationId as jest.Mock
const mockGetOrganizationVersionById = dbOrganizationModule.getOrganizationVersionById as jest.Mock

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
        mockGetOrganizationVersionById.mockResolvedValue({})
        mockHasActiveLicence.mockReturnValue(true)
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

  describe('canDuplicateStudy', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('Should return false if environment is not authorized', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(false)
      const res = await canDuplicateStudy(mockedStudyId)
      expect(res).toBe(false)
      expect(mockHasAccessToDuplicateStudy).toHaveBeenCalledTimes(1)
      expect(mockGetStudyById).toHaveBeenCalledTimes(0)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(0)
      expect(mockGetAccountRoleOnStudy).toHaveBeenCalledTimes(0)
    })

    it('Should return false if study is not found', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockGetStudyById.mockResolvedValue(null)
      const res = await canDuplicateStudy(mockedStudyId)
      expect(res).toBe(false)
      expect(mockHasAccessToDuplicateStudy).toHaveBeenCalledTimes(1)
      expect(mockGetStudyById).toHaveBeenCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(0)
      expect(mockGetAccountRoleOnStudy).toHaveBeenCalledTimes(0)
    })

    it('Should return false if can not edit organization version', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockGetStudyById.mockResolvedValue(getMockedFullStudy())
      mockCanEditOrganizationVersion.mockReturnValue(false)
      const res = await canDuplicateStudy(mockedStudyId)
      expect(res).toBe(false)
      expect(mockHasAccessToDuplicateStudy).toHaveBeenCalledTimes(1)
      expect(mockGetStudyById).toHaveBeenCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(1)
      expect(mockGetAccountRoleOnStudy).toHaveBeenCalledTimes(0)
    })

    it('Should return false if user role is Reader', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockGetStudyById.mockResolvedValue(getMockedFullStudy())
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Reader)
      const res = await canDuplicateStudy(mockedStudyId)
      expect(res).toBe(false)
      expect(mockHasAccessToDuplicateStudy).toHaveBeenCalledTimes(1)
      expect(mockGetStudyById).toHaveBeenCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(1)
      expect(mockGetAccountRoleOnStudy).toHaveBeenCalledTimes(1)
    })

    it('Should return false if user role is Editor', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockGetStudyById.mockResolvedValue(getMockedFullStudy())
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Editor)
      const res = await canDuplicateStudy(mockedStudyId)
      expect(res).toBe(false)
      expect(mockHasAccessToDuplicateStudy).toHaveBeenCalledTimes(1)
      expect(mockGetStudyById).toHaveBeenCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(1)
      expect(mockGetAccountRoleOnStudy).toHaveBeenCalledTimes(1)
    })

    it('Should return true if user has all rights', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockGetStudyById.mockResolvedValue(getMockedFullStudy())
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      const res = await canDuplicateStudy(mockedStudyId)
      expect(res).toBe(true)
      expect(mockHasAccessToDuplicateStudy).toHaveBeenCalledTimes(1)
      expect(mockGetStudyById).toHaveBeenCalledTimes(1)
      expect(mockCanEditOrganizationVersion).toHaveBeenCalledTimes(1)
      expect(mockGetAccountRoleOnStudy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getEnvironmentsForDuplication', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('Should return an empty array if cannot duplicate study', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(false)
      const res = await getEnvironmentsForDuplication(mockedStudyId)
      expect(res).toHaveLength(0)
      expect(mockGetStudyById).toHaveBeenCalledTimes(0)
      expect(mockGetUserActiveAccounts).toHaveBeenCalledTimes(0)
      expect(mockGetOrganizationVersionsByOrganizationId).toHaveBeenCalledTimes(0)
    })

    it('Should return an empty array if study is not found', async () => {
      mockDBActualizedAuth.mockResolvedValue(getMockedDbAccount())
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockGetStudyById.mockResolvedValue(null)
      const res = await getEnvironmentsForDuplication(mockedStudyId)
      expect(res).toHaveLength(0)
      expect(mockGetStudyById).toHaveBeenCalledTimes(1)
      expect(mockGetUserActiveAccounts).toHaveBeenCalledTimes(0)
      expect(mockGetOrganizationVersionsByOrganizationId).toHaveBeenCalledTimes(0)
    })

    it('Should return an empty array if study organization and user organization does not match', async () => {
      // canDuplicateStudy response to true
      mockDBActualizedAuth.mockResolvedValue(
        getMockedDbActualizedAuth({}, { organizationVersionId: 'mocked-organization-id' }),
      )
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      // function mocks
      mockGetStudyById.mockResolvedValue(getMockedFullStudy({ organizationVersionId: 'mocked-study-organization-id' }))
      mockGetUserActiveAccounts.mockResolvedValue({ success: true, data: ['mocked-data', 'mocked-data-2'] })
      const res = await getEnvironmentsForDuplication(mockedStudyId)
      expect(res).toHaveLength(0)
      expect(mockGetStudyById).toHaveBeenCalledTimes(2)
      expect(mockGetUserActiveAccounts).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionsByOrganizationId).toHaveBeenCalledTimes(0)
    })

    it('Should return an empty array if user has no account', async () => {
      // canDuplicateStudy response to true
      mockDBActualizedAuth.mockResolvedValue(
        getMockedDbActualizedAuth({}, { organizationVersionId: 'mocked-study-organization-id' }),
      )
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      // function mocks
      mockGetStudyById.mockResolvedValue(getMockedFullStudy({ organizationVersionId: 'mocked-study-organization-id' }))
      mockGetUserActiveAccounts.mockResolvedValue({ success: true, data: [] })
      const res = await getEnvironmentsForDuplication(mockedStudyId)
      expect(res).toHaveLength(0)
      expect(mockGetStudyById).toHaveBeenCalledTimes(2)
      expect(mockGetUserActiveAccounts).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionsByOrganizationId).toHaveBeenCalledTimes(0)
    })

    it('Should return an empty array if no duplicable environment is detected', async () => {
      // canDuplicateStudy response to true
      mockDBActualizedAuth.mockResolvedValue(
        getMockedDbActualizedAuth({}, { organizationVersionId: 'mocked-study-organization-id' }),
      )
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      // function mocks
      mockGetStudyById.mockResolvedValue(getMockedFullStudy({ organizationVersionId: 'mocked-study-organization-id' }))
      mockGetUserActiveAccounts.mockResolvedValue({
        success: true,
        data: [
          { environment: Environment.BC, organizationVersionId: 'mocked-study-organization-id' },
          { environment: Environment.TILT, organizationVersionId: 'mocked-study-organization-id' },
        ],
      })
      mockGetOrganizationVersionsByOrganizationId.mockResolvedValue([{ id: 'mocked-organization-id-1' }])
      mockGetDuplicableEnvironments.mockReturnValue([])
      const res = await getEnvironmentsForDuplication(mockedStudyId)
      expect(res).toHaveLength(0)
      expect(mockGetStudyById).toHaveBeenCalledTimes(2)
      expect(mockGetUserActiveAccounts).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionsByOrganizationId).toHaveBeenCalledTimes(1)
      expect(mockGetDuplicableEnvironments).toHaveBeenCalledTimes(1)
    })

    it('Should return an empty array if organization versions does not match the user version', async () => {
      // canDuplicateStudy response to true
      mockDBActualizedAuth.mockResolvedValue(
        getMockedDbActualizedAuth({}, { organizationVersionId: 'mocked-study-organization-id' }),
      )
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      // function mocks
      mockGetStudyById.mockResolvedValue(getMockedFullStudy({ organizationVersionId: 'mocked-study-organization-id' }))
      mockGetUserActiveAccounts.mockResolvedValue({
        success: true,
        data: [
          { environment: Environment.BC, organizationVersionId: 'mocked-study-organization-id' },
          { environment: Environment.TILT, organizationVersionId: 'mocked-organization-id' },
        ],
      })
      mockGetOrganizationVersionsByOrganizationId.mockResolvedValue([
        { id: 'mocked-study-organization-id' },
        { id: 'mocked-study-organization-id-2' },
      ])
      mockGetDuplicableEnvironments.mockReturnValue([Environment.TILT])
      const res = await getEnvironmentsForDuplication(mockedStudyId)
      expect(res).toHaveLength(0)
      expect(mockGetStudyById).toHaveBeenCalledTimes(2)
      expect(mockGetUserActiveAccounts).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionsByOrganizationId).toHaveBeenCalledTimes(1)
      expect(mockGetDuplicableEnvironments).toHaveBeenCalledTimes(1)
    })

    it('Should not return an empty array if organization versions matches the user version', async () => {
      // canDuplicateStudy response to true
      mockDBActualizedAuth.mockResolvedValue(
        getMockedDbActualizedAuth({}, { organizationVersionId: 'mocked-study-organization-id' }),
      )
      mockHasAccessToDuplicateStudy.mockReturnValue(true)
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      // function mocks
      mockGetStudyById.mockResolvedValue(getMockedFullStudy({ organizationVersionId: 'mocked-study-organization-id' }))
      mockGetUserActiveAccounts.mockResolvedValue({
        success: true,
        data: [
          { environment: Environment.BC, organizationVersionId: 'mocked-study-organization-id' },
          { environment: Environment.TILT, organizationVersionId: 'mocked-study-organization-id-2' },
        ],
      })
      mockGetOrganizationVersionsByOrganizationId.mockResolvedValue([
        { id: 'mocked-study-organization-id' },
        { id: 'mocked-study-organization-id-2' },
      ])
      mockGetDuplicableEnvironments.mockReturnValue([Environment.TILT])
      const res = await getEnvironmentsForDuplication(mockedStudyId)
      expect(res).toHaveLength(1)
      expect(res[0]).toBe(Environment.TILT)
      expect(mockGetStudyById).toHaveBeenCalledTimes(2)
      expect(mockGetUserActiveAccounts).toHaveBeenCalledTimes(1)
      expect(mockGetOrganizationVersionsByOrganizationId).toHaveBeenCalledTimes(1)
      expect(mockGetDuplicableEnvironments).toHaveBeenCalledTimes(1)
    })
  })
})
