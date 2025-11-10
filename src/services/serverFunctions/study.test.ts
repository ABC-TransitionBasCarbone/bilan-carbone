import { expect } from '@jest/globals'
import { Environment, Import, Level, StudyRole, SubPost } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import * as accountModule from '../../db/account'
import * as emissionFactorsModule from '../../db/emissionFactors'
import * as emissionSourcesModule from '../../db/emissionSource'
import * as organizationModule from '../../db/organization'
import * as studyDbModule from '../../db/study'
import { FullStudy } from '../../db/study'
import * as userDbModule from '../../db/user'
import * as authModule from '../../services/auth'
import * as studyPermissionsModule from '../../services/permissions/study'
import * as userModule from '../../services/serverFunctions/user'
import * as studyModule from '../../services/study'
import { mockedOrganizationVersion } from '../../tests/utils/models/organization'
import {
  getMockedDuplicateStudyCommand,
  getMockeFullStudy,
  mockedDbFullStudySite,
  TEST_EMAILS,
  TEST_IDS,
} from '../../tests/utils/models/study'
import { getMockedDbActualizedAuth } from '../../tests/utils/models/user'
import * as organizationUtilsModule from '../../utils/organization'
import * as studyUtilsModule from '../../utils/study'
import * as userUtilsModule from '../../utils/user'
import type { CreateStudyCommand, DuplicateSiteCommand } from './study.command'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('uuid', () => ({
  v4: jest.fn(),
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
  createEmissionSourceTags: jest.fn(),
}))
const mockTransaction = {
  site: {
    create: jest.fn(),
  },
  studySite: {
    create: jest.fn(),
    updateMany: jest.fn(),
  },
}
jest.mock('../../db/client', () => ({
  prismaClient: {
    $transaction: jest.fn((callback) => callback(mockTransaction)),
  },
}))
jest.mock('../../services/permissions/study', () => ({
  hasEditionRights: jest.fn(),
  getAccountRoleOnStudy: jest.fn(),
  isAdminOnStudyOrga: jest.fn(),
  canCreateSpecificStudy: jest.fn(),
  canDuplicateStudy: jest.fn(),
  canChangeSites: jest.fn(),
}))
jest.mock('../../utils/study', () => ({
  getAccountRoleOnStudy: jest.fn(),
  hasEditionRights: jest.fn(),
}))
jest.mock('../../db/organization', () => ({
  getOrganizationVersionById: jest.fn(),
  isOrganizationVersionCR: jest.fn(),
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
jest.mock('../../db/emissionSource', () => ({
  createTagFamilyAndRelatedTags: jest.fn(),
  getFamilyTagsForStudy: jest.fn(),
  createEmissionSourcesWithReturn: jest.fn(),
}))
jest.mock('../../utils/user', () => ({
  isAdmin: jest.fn(),
}))
jest.mock('../../utils/organization', () => ({
  canEditOrganizationVersion: jest.fn(),
}))
jest.mock('../../utils/number', () => ({
  CA_UNIT_VALUES: { K: 1000, M: 1000000 },
  defaultCAUnit: 'K',
  formatNumber: jest.fn((value: number, decimals: number) => {
    if (isNaN(value)) {
      return '0'
    }
    return value.toFixed(decimals)
  }),
}))
jest.mock('../posts', () => ({
  environmentPostMapping: { BC: 'bc-mapping', CUT: 'cut-mapping', TILT: 'tilt-mapping' },
  subPostsByPostBC: {},
  Post: {
    DechetsDirects: 'DechetsDirects',
    IntrantsBiensEtMatieres: 'IntrantsBiensEtMatieres',
  },
}))
jest.mock('../../utils/post', () => ({
  withInfobulle: jest.fn(),
  getPost: jest.fn(),
  flattenSubposts: jest.fn(),
}))
jest.mock('../../services/study', () => ({
  AdditionalResultTypes: {},
  ResultType: {},
  hasSufficientLevel: jest.fn(),
}))
jest.mock('../results/consolidated', () => ({
  computeResultsByPost: jest.fn(),
}))
jest.mock('./study', () => ({}))

const mockedMonetaryRatio = 40
const mockedNonSpecificMonetaryRatio = 10

const mockedResults = {
  monetaryRatio: mockedMonetaryRatio,
  nonSpecificMonetaryRatio: mockedNonSpecificMonetaryRatio,
}

const { duplicateStudyCommand, mapStudyForReport, duplicateSiteAndEmissionSources } = jest.requireActual('./study')

const mockedSessionValidator = getMockedDbActualizedAuth({}, { email: TEST_EMAILS.validator })
const mockedSession = getMockedDbActualizedAuth({}, { email: TEST_EMAILS.currentUser })
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
const mockCreateEmissionSourceTags = studyDbModule.createEmissionSourceTags as jest.Mock
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
const mockCreateTagFamilyAndRelatedTags = emissionSourcesModule.createTagFamilyAndRelatedTags as jest.Mock
const mockGetFamilyTagsForStudy = emissionSourcesModule.getFamilyTagsForStudy as jest.Mock
const mockCreateEmissionSourcesWithReturn = emissionSourcesModule.createEmissionSourcesWithReturn as jest.Mock
const mockIsOrganizationVersionCR = organizationModule.isOrganizationVersionCR as jest.Mock
const mockCanChangeSites = studyPermissionsModule.canChangeSites as jest.Mock
const mockCanEditOrganizationVersion = organizationUtilsModule.canEditOrganizationVersion as jest.Mock
const mockHasSufficientLevel = studyModule.hasSufficientLevel as jest.Mock

describe('study', () => {
  describe('duplicateStudyCommand', () => {
    const setupSuccessfullDuplication = () => {
      mockCreateTagFamilyAndRelatedTags.mockResolvedValue([])
      mockCreateEmissionSourceTags.mockResolvedValue(undefined)
      mockCreateEmissionSourcesWithReturn.mockResolvedValue([{ id: TEST_IDS.emissionSource }])
      mockGetFamilyTagsForStudy.mockResolvedValue([])
      mockDbActualizedAuth.mockResolvedValue(mockedSession)
      mockCanDuplicateStudy.mockResolvedValue(true)
      mockHasSufficientLevel.mockResolvedValue(true)
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Editor)
      mockGetAccountByEmailAndOrganizationVersionId.mockResolvedValue(mockedSessionValidator)
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
      setupSuccessfullDuplication()
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
          mockTransaction,
        )
      })

      it('should duplicate emission sources with correct site mapping', async () => {
        await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)

        expect(mockCreateEmissionSourcesWithReturn).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Test Emission Source',
              value: 100,
              studyId: TEST_IDS.newStudy,
              studySiteId: TEST_IDS.newStudySite,
              emissionFactorId: TEST_IDS.emissionFactor,
              validated: false,
            }),
          ]),
          mockTransaction,
        )
      })

      it('should duplicate emission sources with tags from multiple tag families', async () => {
        const mockUuidv4 = jest.mocked(uuidv4)
        mockUuidv4
          .mockReturnValueOnce('created-es-1' as unknown as Uint8Array)
          .mockReturnValueOnce('created-es-2' as unknown as Uint8Array)

        const sourceTagFamilies = [
          {
            id: 'family-0-id',
            name: 'défaut',
            tags: [],
          },
          {
            id: 'family-1-id',
            name: 'Scope',
            tags: [
              { id: 'tag-1-id', name: 'Scope 1', color: '#FF0000', familyName: 'Scope' },
              { id: 'tag-2-id', name: 'Scope 2', color: '#00FF00', familyName: 'Scope' },
            ],
          },
          {
            id: 'family-2-id',
            name: 'Category',
            tags: [
              { id: 'tag-3-id', name: 'Transport', color: '#0000FF', familyName: 'Category' },
              { id: 'tag-4-id', name: 'Energy', color: '#FFFF00', familyName: 'Category' },
            ],
          },
        ]

        const targetTagFamilies = [
          {
            id: 'target-family-0-id',
            name: 'défaut',
            tags: [],
          },
          {
            id: 'target-family-1-id',
            name: 'Scope',
            tags: [
              { id: 'target-tag-1-id', name: 'Scope 1', color: '#FF0000' },
              { id: 'target-tag-2-id', name: 'Scope 2', color: '#00FF00' },
            ],
          },
          {
            id: 'target-family-2-id',
            name: 'Category',
            tags: [
              { id: 'target-tag-3-id', name: 'Transport', color: '#0000FF' },
              { id: 'target-tag-4-id', name: 'Energy', color: '#FFFF00' },
            ],
          },
        ]

        const sourceStudyWithTags = getMockeFullStudy({
          emissionSources: [
            {
              ...mockedSourceStudy.emissionSources[0],
              id: 'source-es-1',
              name: 'Emission Source 1',
              value: 100,
              studySite: { id: TEST_IDS.studySite, site: { id: TEST_IDS.site } },
              emissionSourceTags: [
                { tag: { id: 'tag-1-id', name: 'Scope 1' } },
                { tag: { id: 'tag-3-id', name: 'Transport' } },
              ],
            },
            {
              ...mockedSourceStudy.emissionSources[0],
              id: 'source-es-2',
              name: 'Emission Source 2',
              value: 200,
              studySite: { id: TEST_IDS.studySite, site: { id: TEST_IDS.site } },
              emissionSourceTags: [
                { tag: { id: 'tag-2-id', name: 'Scope 2' } },
                { tag: { id: 'tag-4-id', name: 'Energy' } },
              ],
            },
          ],
          tagFamilies: sourceTagFamilies,
        })

        mockGetFamilyTagsForStudy.mockResolvedValue(sourceTagFamilies)
        mockCreateEmissionSourcesWithReturn.mockResolvedValue([{ id: 'created-es-1' }, { id: 'created-es-2' }])

        mockGetStudyById.mockImplementation((id: string) => {
          if (id === TEST_IDS.sourceStudy) {
            return Promise.resolve(sourceStudyWithTags)
          }
          if (id === TEST_IDS.newStudy) {
            return Promise.resolve({
              ...sourceStudyWithTags,
              id: TEST_IDS.newStudy,
              sites: [{ id: TEST_IDS.newStudySite, site: { id: TEST_IDS.site } }],
              tagFamilies: targetTagFamilies,
            })
          }
          return Promise.resolve(null)
        })

        await duplicateStudyCommand(TEST_IDS.sourceStudy, mockedStudyCommand)

        expect(mockCreateStudy).toHaveBeenCalledWith(
          expect.objectContaining({
            tagFamilies: {
              create: sourceTagFamilies.map((tagFamily) => ({
                name: tagFamily.name,
                tags: {
                  create: tagFamily.tags.map((tag) => ({ name: tag.name, color: tag.color })),
                },
              })),
            },
          }),
          Environment.BC,
        )

        expect(mockCreateEmissionSourcesWithReturn).toHaveBeenCalledWith(
          [
            expect.objectContaining({
              name: 'Emission Source 1',
              value: 100,
              studyId: TEST_IDS.newStudy,
              studySiteId: TEST_IDS.newStudySite,
            }),
            expect.objectContaining({
              name: 'Emission Source 2',
              value: 200,
              studyId: TEST_IDS.newStudy,
              studySiteId: TEST_IDS.newStudySite,
            }),
          ],
          mockTransaction,
        )

        expect(mockCreateEmissionSourceTags).toHaveBeenCalledWith(
          [
            { emissionSourceId: 'created-es-1', tagId: 'target-tag-1-id' },
            { emissionSourceId: 'created-es-1', tagId: 'target-tag-3-id' },
            { emissionSourceId: 'created-es-2', tagId: 'target-tag-2-id' },
            { emissionSourceId: 'created-es-2', tagId: 'target-tag-4-id' },
          ],
          mockTransaction,
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

  describe('mapStudyForReport', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('team organization', () => {
      it('should correctly organize admin, internal team members, and contributors', async () => {
        mockIsOrganizationVersionCR.mockResolvedValue(false)

        const mockedStudyWithTeam = getMockeFullStudy({
          organizationVersion: {
            ...mockedOrganizationVersion,
            parentId: null, // Not a parent CR
          },
          allowedUsers: [
            {
              account: {
                id: 'validator-account-id',
                user: {
                  id: 'validator-user-id',
                  level: Level.Initial,
                  email: 'validator@email.com',
                  firstName: 'John',
                  lastName: 'Validator',
                },
                organizationVersionId: TEST_IDS.orgVersion,
                readerOnly: false,
              },
              role: StudyRole.Validator,
              accountId: 'validator-account-id',
              createdAt: new Date('2024-01-01'),
            },
            {
              account: {
                id: 'internal-editor-id',
                user: {
                  id: 'internal-editor-user-id',
                  level: Level.Initial,
                  email: 'jane@email.com',
                  firstName: 'Jane',
                  lastName: 'Editor',
                },
                organizationVersionId: TEST_IDS.orgVersion,
                readerOnly: false,
              },
              role: StudyRole.Editor,
              accountId: 'internal-editor-id',
              createdAt: new Date('2024-01-02'),
            },
          ],
        })

        const result = await mapStudyForReport(mockedStudyWithTeam, mockedResults)

        expect(result.admin).toEqual({
          accountId: 'validator-account-id',
          name: 'John Validator',
          role: StudyRole.Validator,
          createdAt: new Date('2024-01-01'),
          isInternal: true,
          isExternal: false,
        })

        expect(result.internalTeam).toHaveLength(1)
        expect(result.internalTeam).toContainEqual({
          accountId: 'internal-editor-id',
          name: 'Jane Editor',
          role: StudyRole.Editor,
          createdAt: new Date('2024-01-02'),
          isInternal: true,
          isExternal: false,
        })

        expect(result.externalTeam).toHaveLength(0)
      })

      it('should handle parent CR organization scenarios', async () => {
        mockIsOrganizationVersionCR.mockResolvedValue(true)

        const mockedStudyWithParentCR = getMockeFullStudy({
          organizationVersion: {
            ...mockedOrganizationVersion,
            parentId: 'parent-id',
          },
          allowedUsers: [
            {
              account: {
                id: 'parent-user-id',
                user: {
                  id: 'parent-user-id',
                  firstName: 'Parent',
                  lastName: 'User',
                },
                organizationVersionId: 'parent-id',
              },
              role: StudyRole.Validator,
              accountId: 'parent-user-id',
              createdAt: new Date('2024-01-01'),
            },
            {
              account: {
                id: 'parent-user-id-2',
                user: {
                  id: 'parent-user-id-2',
                  firstName: 'Parent 2',
                  lastName: 'User',
                },
                organizationVersionId: 'parent-id',
              },
              role: StudyRole.Validator,
              accountId: 'parent-user-id-2',
              createdAt: new Date('2025-01-01'),
            },
          ],
          contributors: [
            {
              accountId: 'contributor-account-id',
              account: {
                id: 'contributor-account-id',
                user: {
                  id: 'contributor-user-id',
                  firstName: 'Contributor',
                  lastName: 'Contributor',
                },
              },
            },
          ],
        })

        const result = await mapStudyForReport(mockedStudyWithParentCR, mockedResults)

        expect(result.admin).toEqual({
          accountId: 'parent-user-id',
          name: 'Parent User',
          role: StudyRole.Validator,
          createdAt: new Date('2024-01-01'),
          isInternal: false,
          isExternal: true,
        })

        // Contributors should be internal when there's a parent CR
        expect(result.internalTeam).toContainEqual({
          accountId: 'contributor-account-id',
          name: 'Contributor Contributor',
          isInternal: true,
          isExternal: false,
        })

        // Parent users should be external
        expect(result.externalTeam).toContainEqual({
          accountId: 'parent-user-id-2',
          name: 'Parent 2 User',
          role: StudyRole.Validator,
          createdAt: new Date('2025-01-01'),
          isInternal: false,
          isExternal: true,
        })
      })

      it('should deduplicate contributors in a CR scenario', async () => {
        mockIsOrganizationVersionCR.mockResolvedValue(true)

        const mockedStudyWithDuplicates = getMockeFullStudy({
          organizationVersion: {
            ...mockedOrganizationVersion,
            parentId: 'parent-id',
          },
          contributors: [
            {
              accountId: 'duplicate-id',
              account: {
                id: 'duplicate-id',
                user: {
                  id: 'duplicate-user-id',
                  firstName: 'Duplicate',
                  lastName: 'User',
                },
                organizationVersionId: TEST_IDS.orgVersion,
              },
              subPost: 'Achats',
            },
            {
              accountId: 'duplicate-id',
              account: {
                id: 'duplicate-id',
                user: {
                  id: 'duplicate-user-id',
                  level: Level.Initial,
                  email: 'duplicate@email.com',
                  firstName: 'Duplicate',
                  lastName: 'User',
                },
                organizationVersionId: TEST_IDS.orgVersion,
              },
              subPost: 'Déchets',
            },
          ],
        })

        const result = await mapStudyForReport(mockedStudyWithDuplicates, mockedResults)

        const contributorCount =
          result.internalTeam.filter((member: { accountId: string }) => member.accountId === 'duplicate-id').length +
          result.externalTeam.filter((member: { accountId: string }) => member.accountId === 'duplicate-id').length

        expect(contributorCount).toBe(1)
      })
    })

    describe('monetary ratio calculations', () => {
      it('should calculate monetary ratios correctly', async () => {
        const mockedStudyWithResults = getMockeFullStudy()

        const result = await mapStudyForReport(mockedStudyWithResults, mockedResults)

        expect(result.monetaryRatioPercentage).toBe(mockedMonetaryRatio.toFixed(2))
        expect(result.specificMonetaryRatioPercentage).toBe(
          (mockedMonetaryRatio - mockedNonSpecificMonetaryRatio).toFixed(2),
        )
        expect(result.nonSpecificMonetaryRatioPercentage).toBe(mockedNonSpecificMonetaryRatio.toFixed(2))
      })
    })

    describe('other fields', () => {
      it('should map sites correctly', async () => {
        const mockedStudyWithSites = getMockeFullStudy({
          sites: [
            {
              id: 'study-site-1',
              site: { id: 'site-1', name: 'Site One', city: 'Paris', postalCode: '75001' },
            },
            {
              id: 'study-site-2',
              site: { id: 'site-2', name: 'Site Two', city: 'Lyon', postalCode: '69001' },
            },
          ],
        })

        const result = await mapStudyForReport(mockedStudyWithSites, mockedResults)

        expect(result.sites).toEqual([
          {
            id: 'study-site-1',
            name: 'Site One',
            city: 'Paris',
            postalCode: '75001',
          },
          {
            id: 'study-site-2',
            name: 'Site Two',
            city: 'Lyon',
            postalCode: '69001',
          },
        ])
      })
    })
  })

  describe('duplicateSiteAndEmissionSources', () => {
    const createMockEmissionSource = (overrides?: Partial<FullStudy['emissionSources'][0]>) => ({
      id: 'source-es-1',
      name: 'Source Emission',
      value: 100,
      subPost: SubPost.Achats,
      studySite: { id: TEST_IDS.studySite, site: { id: TEST_IDS.site } },
      emissionSourceTags: [],
      emissionFactor: { id: 'ef-1' },
      contributor: null,
      type: null,
      source: null,
      comment: null,
      depreciationPeriod: null,
      hectare: null,
      duration: null,
      reliability: null,
      technicalRepresentativeness: null,
      geographicRepresentativeness: null,
      temporalRepresentativeness: null,
      completeness: null,
      feReliability: null,
      feTechnicalRepresentativeness: null,
      feGeographicRepresentativeness: null,
      feTemporalRepresentativeness: null,
      feCompleteness: null,
      caracterisation: null,
      validated: true,
      ...overrides,
    })

    const createMockStudySite = (overrides?: Partial<typeof mockedDbFullStudySite>) => ({
      ...mockedDbFullStudySite,
      etp: 1,
      ca: 2,
      volunteerNumber: 3,
      beneficiaryNumber: 4,
      ...overrides,
    })

    const setupIncrementalSiteCreationMocks = () => {
      let siteIdCounter = 1
      mockTransaction.site.create.mockImplementation(async ({ data }) => {
        const id = `new-site-${siteIdCounter++}`
        return { id, ...data }
      })

      let studySiteIdCounter = 1
      mockTransaction.studySite.create.mockImplementation(async ({ data }) => {
        const id = `new-study-site-${studySiteIdCounter++}`
        return { id, ...data }
      })
    }

    const setupMockGetStudyByIdWithNewSites = (baseStudy: FullStudy, newSites: Array<{ id: string; name: string }>) => {
      mockGetStudyById.mockImplementation((studyId: string, _orgId?: string, tx?: unknown) => {
        if (tx) {
          return Promise.resolve({
            ...baseStudy,
            sites: [
              ...baseStudy.sites,
              ...newSites.map((site) =>
                createMockStudySite({
                  id: site.id,
                  site: {
                    ...mockedDbFullStudySite.site,
                    id: site.id.replace('study-site', 'site'),
                    name: site.name,
                  },
                }),
              ),
            ],
          })
        }
        return Promise.resolve(baseStudy)
      })
    }

    const createDuplicateSiteCommand = (overrides?: Partial<DuplicateSiteCommand>): DuplicateSiteCommand => ({
      sourceSiteId: TEST_IDS.studySite,
      targetSiteIds: [],
      newSitesCount: 0,
      organizationId: 'org-id',
      studyId: TEST_IDS.sourceStudy,
      fieldsToDuplicate: ['emissionSources'],
      ...overrides,
    })

    const setupSiteDuplicationMocks = (study = getMockeFullStudy()) => {
      mockDbActualizedAuth.mockResolvedValue(mockedSession)
      mockGetStudyById.mockResolvedValue(study)
      mockCanChangeSites.mockResolvedValue(true)
      mockGetOrganizationVersionById.mockResolvedValue({
        id: TEST_IDS.orgVersion,
        organization: {
          id: 'organization-id',
          sites: [
            { id: TEST_IDS.site, name: 'Site 1' },
            { id: 'site-2', name: 'Site 2' },
          ],
        },
        environment: Environment.BC,
      })
      mockCanEditOrganizationVersion.mockReturnValue(true)
      mockGetFamilyTagsForStudy.mockResolvedValue([])
      mockCreateEmissionSourcesWithReturn.mockResolvedValue([])
      mockCreateEmissionSourceTags.mockResolvedValue(undefined)
      mockTransaction.site.create.mockImplementation(async ({ data }) => ({
        id: `new-site-${Math.random()}`,
        ...data,
      }))
      mockTransaction.studySite.create.mockImplementation(async ({ data }) => ({
        id: `new-study-site-${Math.random()}`,
        ...data,
      }))
      mockTransaction.studySite.updateMany.mockResolvedValue({ count: 0 })
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('Authorization', () => {
      it('should return error when user cannot change sites', async () => {
        const study = getMockeFullStudy()
        setupSiteDuplicationMocks(study)
        mockCanChangeSites.mockResolvedValue(false)

        const command = createDuplicateSiteCommand({ targetSiteIds: ['target-site-1'] })

        const result = await duplicateSiteAndEmissionSources(command)
        expect(result).toEqual({ success: false, errorMessage: 'Not authorized' })
      })
    })

    describe('Target sites only', () => {
      it('should duplicate emission sources to existing target sites', async () => {
        const mockUuidv4 = jest.mocked(uuidv4)
        mockUuidv4.mockReturnValueOnce('new-es-1' as unknown as Uint8Array)

        const sourceEmissionSource = createMockEmissionSource()

        const study = getMockeFullStudy({
          sites: [
            createMockStudySite({ id: TEST_IDS.studySite, site: { ...mockedDbFullStudySite.site, id: TEST_IDS.site } }),
            createMockStudySite({ id: 'target-site-1', site: { ...mockedDbFullStudySite.site, id: TEST_IDS.site } }),
          ],
          emissionSources: [sourceEmissionSource],
        })

        setupSiteDuplicationMocks(study)
        setupMockGetStudyByIdWithNewSites(study, [])

        const command = createDuplicateSiteCommand({
          targetSiteIds: ['target-site-1'],
          fieldsToDuplicate: ['emissionSources', 'etp', 'ca', 'volunteerNumber', 'beneficiaryNumber'],
        })

        mockCreateEmissionSourcesWithReturn.mockResolvedValue([{ id: 'new-es-1' }])

        const result = await duplicateSiteAndEmissionSources(command)

        expect(result).toEqual({ success: true, data: undefined })
        expect(mockCreateEmissionSourcesWithReturn).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Source Emission',
              value: 100,
              studyId: TEST_IDS.sourceStudy,
              validated: false,
            }),
          ]),
          mockTransaction,
        )
        expect(mockTransaction.site.create).toHaveBeenCalledTimes(0)
        expect(mockTransaction.studySite.updateMany).toHaveBeenCalledTimes(1)
        expect(mockTransaction.studySite.updateMany).toHaveBeenCalledWith({
          where: { id: { in: ['target-site-1'] } },
          data: { etp: 1, ca: 2, volunteerNumber: 3, beneficiaryNumber: 4 },
        })
      })
    })

    describe('New sites only', () => {
      it('should create new sites and duplicate emission sources to them', async () => {
        const mockUuidv4 = jest.mocked(uuidv4)
        mockUuidv4.mockReturnValueOnce('new-es-1' as unknown as Uint8Array)

        const sourceEmissionSource = createMockEmissionSource()

        const study = getMockeFullStudy({
          sites: [
            createMockStudySite({
              id: TEST_IDS.studySite,
              site: { ...mockedDbFullStudySite.site, id: TEST_IDS.site, name: 'Original Site' },
            }),
          ],
          emissionSources: [sourceEmissionSource],
        })

        setupSiteDuplicationMocks(study)
        setupIncrementalSiteCreationMocks()
        setupMockGetStudyByIdWithNewSites(study, [
          { id: 'new-study-site-1', name: 'Original Site - Copie 1' },
          { id: 'new-study-site-2', name: 'Original Site - Copie 2' },
        ])

        const command = createDuplicateSiteCommand({
          newSitesCount: 2,
          fieldsToDuplicate: ['emissionSources', 'etp', 'ca', 'volunteerNumber', 'beneficiaryNumber'],
        })

        mockCreateEmissionSourcesWithReturn.mockResolvedValue([{ id: 'new-es-1' }, { id: 'new-es-2' }])

        const result = await duplicateSiteAndEmissionSources(command)

        expect(result).toEqual({ success: true, data: undefined })
        expect(mockCreateEmissionSourcesWithReturn).toHaveBeenCalledTimes(1)
        expect(mockTransaction.site.create).toHaveBeenCalledTimes(2)

        expect(mockTransaction.site.create).toHaveBeenNthCalledWith(1, {
          data: expect.objectContaining({
            name: 'Original Site - Copie 1',
            etp: 1,
            ca: 2,
            volunteerNumber: 3,
            beneficiaryNumber: 4,
            organization: { connect: { id: 'org-id' } },
          }),
        })

        expect(mockTransaction.site.create).toHaveBeenNthCalledWith(2, {
          data: expect.objectContaining({
            name: 'Original Site - Copie 2',
            etp: 1,
            ca: 2,
            volunteerNumber: 3,
            beneficiaryNumber: 4,
            organization: { connect: { id: 'org-id' } },
          }),
        })
      })
    })

    describe('Both target sites and new sites', () => {
      it('should duplicate to both existing and new sites', async () => {
        const mockUuidv4 = jest.mocked(uuidv4)
        mockUuidv4
          .mockReturnValueOnce('new-es-1' as unknown as Uint8Array)
          .mockReturnValueOnce('new-es-2' as unknown as Uint8Array)

        const sourceEmissionSource = createMockEmissionSource()

        const study = getMockeFullStudy({
          sites: [
            createMockStudySite({
              id: TEST_IDS.studySite,
              site: { ...mockedDbFullStudySite.site, id: TEST_IDS.site, name: 'Original Site' },
            }),
            createMockStudySite({
              id: 'existing-target-site',
              site: { ...mockedDbFullStudySite.site, id: TEST_IDS.site },
            }),
          ],
          emissionSources: [sourceEmissionSource],
        })

        setupSiteDuplicationMocks(study)
        setupIncrementalSiteCreationMocks()
        setupMockGetStudyByIdWithNewSites(study, [{ id: 'new-study-site-1', name: 'Original Site - Copie 1' }])

        const command = createDuplicateSiteCommand({
          targetSiteIds: ['existing-target-site'],
          newSitesCount: 1,
          fieldsToDuplicate: ['emissionSources', 'etp', 'ca', 'volunteerNumber', 'beneficiaryNumber'],
        })

        mockCreateEmissionSourcesWithReturn.mockResolvedValue([{ id: 'new-es-1' }, { id: 'new-es-2' }])

        const result = await duplicateSiteAndEmissionSources(command)

        expect(result).toEqual({ success: true, data: undefined })
        expect(mockCreateEmissionSourcesWithReturn).toHaveBeenCalledTimes(1)
        expect(mockCreateEmissionSourcesWithReturn).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Source Emission',
              value: 100,
              validated: false,
            }),
          ]),
          mockTransaction,
        )
        expect(mockTransaction.studySite.create).toHaveBeenCalledTimes(1)
        expect(mockTransaction.studySite.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            etp: 1,
            ca: 2,
            volunteerNumber: 3,
            beneficiaryNumber: 4,
          }),
        })
      })

      it('should not duplicate fields that are not in the command', async () => {
        const sourceEmissionSource = createMockEmissionSource()

        const study = getMockeFullStudy({
          sites: [
            createMockStudySite({
              id: TEST_IDS.studySite,
              site: { ...mockedDbFullStudySite.site, id: TEST_IDS.site, name: 'Original Site' },
            }),
            createMockStudySite({
              id: 'existing-target-site',
              site: { ...mockedDbFullStudySite.site, id: TEST_IDS.site },
            }),
          ],
          emissionSources: [sourceEmissionSource],
        })

        setupSiteDuplicationMocks(study)
        setupIncrementalSiteCreationMocks()

        const newSiteData = createMockStudySite({
          id: 'new-study-site-1',
          site: { ...mockedDbFullStudySite.site, id: 'new-site-1', name: 'Original Site - Copie 1' },
          etp: 1,
          ca: 2,
          volunteerNumber: 3,
          beneficiaryNumber: 4,
        })

        mockGetStudyById.mockImplementation((studyId: string, _orgId?: string, tx?: unknown) => {
          if (tx) {
            return Promise.resolve({
              ...study,
              sites: [...study.sites, newSiteData],
            })
          }
          return Promise.resolve(study)
        })

        const command = createDuplicateSiteCommand({
          targetSiteIds: ['existing-target-site'],
          newSitesCount: 1,
        })

        const result = await duplicateSiteAndEmissionSources(command)

        expect(result).toEqual({ success: true, data: undefined })
        expect(mockTransaction.studySite.create).toHaveBeenCalledTimes(1)
        expect(mockTransaction.studySite.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            etp: 0,
            ca: 0,
            study: { connect: { id: TEST_IDS.sourceStudy } },
          }),
        })
        expect(mockTransaction.studySite.updateMany).toHaveBeenCalledTimes(0)
      })
    })
  })
})
