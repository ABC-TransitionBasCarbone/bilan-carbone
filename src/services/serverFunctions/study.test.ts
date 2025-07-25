import { expect } from '@jest/globals'
import { Import, StudyRole } from '@prisma/client'
import * as accountModule from '../../db/account'
import * as emissionFactorsModule from '../../db/emissionFactors'
import * as organizationModule from '../../db/organization'
import * as studyDbModule from '../../db/study'
import * as userDbModule from '../../db/user'
import * as authModule from '../../services/auth'
import * as studyPermissionsModule from '../../services/permissions/study'
import * as userModule from '../../services/serverFunctions/user'
import {
  getMockedDuplicateStudyCommand,
  getMockeFullStudy,
  TEST_EMAILS,
  TEST_IDS,
} from '../../tests/utils/models/study'
import { getMockedAuthUser } from '../../tests/utils/models/user'
import * as studyUtilsModule from '../../utils/study'
import * as userUtilsModule from '../../utils/user'
import type { CreateStudyCommand } from './study.command'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('../../services/auth', () => ({
  dbActualizedAuth: jest.fn(),
}))
jest.mock('../../db/study', () => ({
  getStudyById: jest.fn(),
  getStudySites: jest.fn(),
  createStudyEmissionSource: jest.fn(),
  createUserOnStudy: jest.fn(),
  createStudy: jest.fn(),
  updateStudyEmissionFactorVersion: jest.fn(),
  createContributorOnStudy: jest.fn(),
}))
jest.mock('../../services/permissions/study', () => ({
  hasEditionRights: jest.fn(),
  getAccountRoleOnStudy: jest.fn(),
  isAdminOnStudyOrga: jest.fn(),
  canCreateSpecificStudy: jest.fn(),
  canDuplicateStudy: jest.fn(),
}))
jest.mock('../../utils/study', () => ({
  getAccountRoleOnStudy: jest.fn(),
  hasEditionRights: jest.fn(),
}))
jest.mock('../../db/organization', () => ({
  getOrganizationVersionById: jest.fn(),
}))
jest.mock('../../db/user', () => ({
  getUserByEmail: jest.fn(),
  getUserApplicationSettings: jest.fn(),
  getUserSourceById: jest.fn(),
}))
jest.mock('../../db/account', () => ({
  getAccountByEmailAndOrganizationVersionId: jest.fn(),
  getAccountByEmailAndEnvironment: jest.fn(),
}))
jest.mock('../../services/serverFunctions/user', () => ({
  addUserChecklistItem: jest.fn(),
}))
jest.mock('../../utils/serverResponse', () => ({
  withServerResponse: jest.fn(async (_name, fn) => {
    try {
      const data = await fn()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }),
}))
jest.mock('../../db/emissionFactors', () => ({
  getEmissionFactorsImportActiveVersion: jest.fn(),
}))
jest.mock('../../utils/user', () => ({
  isAdmin: jest.fn(),
}))
jest.mock('../../utils/number', () => ({
  CA_UNIT_VALUES: { K: 1000, M: 1000000 },
  defaultCAUnit: 'K',
}))
jest.mock('./study', () => ({}))

const { duplicateStudyCommand } = jest.requireActual('./study')

const mockedAuthUser = getMockedAuthUser({ email: TEST_EMAILS.currentUser })
const mockedSourceStudy = getMockeFullStudy()
const mockedStudyCommand = getMockedDuplicateStudyCommand() as CreateStudyCommand

const mockDbActualizedAuth = authModule.dbActualizedAuth as jest.Mock
const mockGetStudyById = studyDbModule.getStudyById as jest.Mock
const mockGetStudySites = studyDbModule.getStudySites as jest.Mock
const mockCreateStudyEmissionSource = studyDbModule.createStudyEmissionSource as jest.Mock
const mockCreateUserOnStudy = studyDbModule.createUserOnStudy as jest.Mock
const mockCreateStudy = studyDbModule.createStudy as jest.Mock
const mockUpdateStudyEmissionFactorVersion = studyDbModule.updateStudyEmissionFactorVersion as jest.Mock
const mockCreateContributorOnStudy = studyDbModule.createContributorOnStudy as jest.Mock
const mockAddUserChecklistItem = userModule.addUserChecklistItem as jest.Mock
const mockGetOrganizationVersionById = organizationModule.getOrganizationVersionById as jest.Mock
const mockGetUserByEmail = userDbModule.getUserByEmail as jest.Mock
const mockGetUserApplicationSettings = userDbModule.getUserApplicationSettings as jest.Mock
const mockGetUserSourceById = userDbModule.getUserSourceById as jest.Mock
const mockGetAccountByEmailAndOrganizationVersionId =
  accountModule.getAccountByEmailAndOrganizationVersionId as jest.Mock
const mockGetAccountByEmailAndEnvironment = accountModule.getAccountByEmailAndEnvironment as jest.Mock
const mockGetAccountRoleOnStudy = studyUtilsModule.getAccountRoleOnStudy as jest.Mock
const mockCanCreateSpecificStudy = studyPermissionsModule.canCreateSpecificStudy as jest.Mock
const mockCanDuplicateStudy = studyPermissionsModule.canDuplicateStudy as jest.Mock
const mockGetEmissionFactorsImportActiveVersion =
  emissionFactorsModule.getEmissionFactorsImportActiveVersion as jest.Mock
const mockIsAdmin = userUtilsModule.isAdmin as unknown as jest.Mock

describe('duplicateStudyCommand', () => {
  const setupSuccessfulDuplication = () => {
    mockDbActualizedAuth.mockResolvedValue({ user: mockedAuthUser })
    mockCanDuplicateStudy.mockResolvedValue(true)
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Editor)
    mockGetAccountByEmailAndOrganizationVersionId.mockResolvedValue({ id: 'validator-account-id' })
    mockGetOrganizationVersionById.mockImplementation(() =>
      Promise.resolve({
        id: TEST_IDS.orgVersion,
        organization: {
          id: 'organization-id',
          sites: [{ id: TEST_IDS.site }],
        },
        environment: 'BC',
      }),
    )
    mockGetUserApplicationSettings.mockResolvedValue({ caUnit: 'K' })
    mockCanCreateSpecificStudy.mockResolvedValue(true)
    mockGetEmissionFactorsImportActiveVersion.mockResolvedValue({ id: 'active-version-id' })
    mockIsAdmin.mockReturnValue(false)
    mockGetStudyById.mockImplementation((id: string) => {
      if (id === TEST_IDS.sourceStudy) {
        return Promise.resolve(mockedSourceStudy)
      }
      if (id === TEST_IDS.newStudy) {
        return Promise.resolve({
          ...mockedSourceStudy,
          id: TEST_IDS.newStudy,
          sites: [{ id: TEST_IDS.newStudySite, site: { id: TEST_IDS.site } }],
        })
      }
      return Promise.resolve(null)
    })
    mockGetStudySites.mockResolvedValue([{ id: TEST_IDS.newStudySite }])
    mockAddUserChecklistItem.mockResolvedValue(undefined)
    mockUpdateStudyEmissionFactorVersion.mockResolvedValue(undefined)
    mockCreateStudyEmissionSource.mockResolvedValue(undefined)
    mockCreateStudy.mockResolvedValue({ id: TEST_IDS.newStudy })
    mockCreateContributorOnStudy.mockResolvedValue(undefined)
  }

  const setupInvitationMocks = () => {
    mockGetUserByEmail.mockResolvedValue({ id: 'existing-user-id' })
    mockGetUserSourceById.mockResolvedValue({ source: 'BC' })
    mockGetAccountByEmailAndEnvironment.mockResolvedValue({ id: 'account-by-email-env-id' })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setupSuccessfulDuplication()
  })

  it('should successfully duplicate a study with basic data', async () => {
    const result = await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)

    expect(result).toEqual({ success: true, data: { id: TEST_IDS.newStudy } })
    expect(mockAddUserChecklistItem).toHaveBeenCalled()
    expect(mockCreateUserOnStudy).not.toHaveBeenCalled()
    expect(mockCreateContributorOnStudy).not.toHaveBeenCalled()
  })

  describe('Authentication and Authorization', () => {
    it('should return error when user is not authenticated', async () => {
      mockDbActualizedAuth.mockResolvedValue(null)

      const result = await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)
      expect(result).toEqual({ success: false, errorMessage: 'Not authorized' })
    })

    it('should return error when source study is not found', async () => {
      mockGetStudyById.mockResolvedValue(null)

      const result = await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)
      expect(result).toEqual({ success: false, errorMessage: 'Not authorized' })
    })

    it('should return error when user cannot duplicate source study', async () => {
      mockCanDuplicateStudy.mockResolvedValue(false)

      const result = await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)
      expect(result).toEqual({ success: false, errorMessage: 'Not authorized' })
    })
  })

  describe('Data Duplication', () => {
    it('should duplicate emission factor versions', async () => {
      await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)

      expect(mockUpdateStudyEmissionFactorVersion).toHaveBeenCalledWith(
        TEST_IDS.newStudy,
        Import.BaseEmpreinte,
        TEST_IDS.importVersion,
      )
    })

    it('should duplicate emission sources with correct site mapping', async () => {
      await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)

      expect(mockCreateStudyEmissionSource).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Emission Source',
          value: 100,
          study: { connect: { id: TEST_IDS.newStudy } },
          studySite: { connect: { id: TEST_IDS.newStudySite } },
          emissionFactor: { connect: { id: TEST_IDS.emissionFactor } },
          validated: false,
        }),
      )
    })
  })

  describe('Team and Contributor Invitations', () => {
    beforeEach(() => {
      setupInvitationMocks()
    })

    it('should invite existing team members when flag is true', async () => {
      const result = await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand, true, false)

      expect(result).toEqual({ success: true, data: { id: TEST_IDS.newStudy } })
      expect(mockCreateUserOnStudy).toHaveBeenCalled()
      expect(mockCreateContributorOnStudy).not.toHaveBeenCalled()
    })

    it('should invite existing contributors when flag is true', async () => {
      const result = await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand, false, true)

      expect(result).toEqual({ success: true, data: { id: TEST_IDS.newStudy } })
      expect(mockCreateContributorOnStudy).toHaveBeenCalled()
      expect(mockCreateUserOnStudy).not.toHaveBeenCalled()
    })

    it('should skip current user when inviting team members', async () => {
      const studyWithCurrentUser = getMockeFullStudy({
        allowedUsers: [
          {
            id: 'current-user-study-id',
            account: { user: { email: TEST_EMAILS.currentUser } },
            role: StudyRole.Editor,
          },
        ],
      })
      mockGetStudyById.mockImplementation((id: string) => {
        if (id === TEST_IDS.sourceStudy) {
          return Promise.resolve(studyWithCurrentUser)
        }
        if (id === TEST_IDS.newStudy) {
          return Promise.resolve({
            ...studyWithCurrentUser,
            id: TEST_IDS.newStudy,
            sites: [{ id: TEST_IDS.newStudySite, site: { id: TEST_IDS.site } }],
          })
        }
        return Promise.resolve(null)
      })

      const result = await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand, true, false)

      expect(result).toEqual({ success: true, data: { id: TEST_IDS.newStudy } })
      expect(mockCreateUserOnStudy).not.toHaveBeenCalled()
    })
  })
})
