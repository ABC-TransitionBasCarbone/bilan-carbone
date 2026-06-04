import { mockedOrganizationVersion } from '@/tests/utils/models/organization'
import { getMockedFullStudy, getMockedFullStudySite, getMockeFullStudy, TEST_IDS } from '@/tests/utils/models/study'
import { ControlMode, Export, Level, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import * as organizationModule from '../db/organization'
import { mapStudyForReport } from './studyReport.utils'

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => () => (key: string) => key),
}))

jest.mock('@/i18n/locale', () => ({
  getLocale: jest.fn().mockResolvedValue('fr'),
}))

jest.mock('@/utils/translation.utils', () => ({
  getBcTranslations: jest.fn(() => ({
    exports: { Beges: 'Bilan GES Réglementaire', GHGP: 'GHG Protocol', ISO14069: 'ISO 14069' },
    study: {
      engagementActions: {
        phases: {
          AwarnessAndOutreach: 'Mobilisation et sensibilisation',
          Empowerment: 'Responsabilisation',
          CoConstruction: 'Co-construction',
          FeedbackAndCommunication: 'Retours et communication',
        },
      },
      transitionPlan: {
        actions: {
          category: {
            Immediate: 'Immédiate',
            Strategic: 'Stratégique',
            Priority: 'Prioritaire',
            Improvement: 'Amélioration de la démarche',
            Adaptation: 'Adaptation',
          },
          potentialDeduction: {
            Quality: 'Qualitative',
            Quantity: 'Quantitative',
            EmissionSources: "Sources d'émissions (à venir)",
          },
        },
      },
    },
  })),
}))

jest.mock('@/db/organization', () => ({
  isOrganizationVersionCR: jest.fn().mockResolvedValue(false),
}))

jest.mock('@/db/study', () => ({
  getEngagementActions: jest.fn().mockResolvedValue([]),
}))

jest.mock('@/db/transitionPlan', () => ({
  getTransitionPlanByStudyId: jest.fn().mockResolvedValue(null),
  getActions: jest.fn().mockResolvedValue([]),
}))

const mockIsOrganizationVersionCR = organizationModule.isOrganizationVersionCR as jest.Mock

const baseResults = { monetaryRatio: 0.5, nonSpecificMonetaryRatio: 0.2 }

describe('mapStudyForReport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsOrganizationVersionCR.mockResolvedValue(false)
  })

  describe('team organization', () => {
    it('should correctly organize admin, internal team members, and contributors', async () => {
      const study = getMockeFullStudy({
        organizationVersion: {
          ...mockedOrganizationVersion,
          parentId: null,
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

      const result = await mapStudyForReport(study, baseResults)

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

      const study = getMockeFullStudy({
        organizationVersion: {
          ...mockedOrganizationVersion,
          parentId: 'parent-id',
        },
        allowedUsers: [
          {
            account: {
              id: 'parent-user-id',
              user: { id: 'parent-user-id', firstName: 'Parent', lastName: 'User' },
              organizationVersionId: 'parent-id',
            },
            role: StudyRole.Validator,
            accountId: 'parent-user-id',
            createdAt: new Date('2024-01-01'),
          },
          {
            account: {
              id: 'parent-user-id-2',
              user: { id: 'parent-user-id-2', firstName: 'Parent 2', lastName: 'User' },
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
              user: { id: 'contributor-user-id', firstName: 'Contributor', lastName: 'Contributor' },
            },
          },
        ],
      })

      const result = await mapStudyForReport(study, baseResults)

      expect(result.admin).toEqual({
        accountId: 'parent-user-id',
        name: 'Parent User',
        role: StudyRole.Validator,
        createdAt: new Date('2024-01-01'),
        isInternal: false,
        isExternal: true,
      })
      expect(result.internalTeam).toContainEqual({
        accountId: 'contributor-account-id',
        name: 'Contributor Contributor',
        isInternal: true,
        isExternal: false,
      })
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

      const study = getMockeFullStudy({
        organizationVersion: {
          ...mockedOrganizationVersion,
          parentId: 'parent-id',
        },
        contributors: [
          {
            accountId: 'duplicate-id',
            account: {
              id: 'duplicate-id',
              user: { id: 'duplicate-user-id', firstName: 'Duplicate', lastName: 'User' },
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
            subPost: 'Fret',
          },
        ],
      })

      const result = await mapStudyForReport(study, baseResults)

      const contributorCount =
        result.internalTeam.filter((m: { accountId: string }) => m.accountId === 'duplicate-id').length +
        result.externalTeam.filter((m: { accountId: string }) => m.accountId === 'duplicate-id').length
      expect(contributorCount).toBe(1)
    })
  })

  describe('externalTeam', () => {
    it('includes the admin when the admin is external', async () => {
      const externalAdminAccountId = 'external-admin-id'
      const externalOrgVersionId = 'other-org-version-id'
      const study = getMockedFullStudy({
        organizationVersionId: 'own-org-version-id',
        organizationVersion: {
          ...getMockedFullStudy().organizationVersion,
          id: 'own-org-version-id',
          parentId: null,
        },
        allowedUsers: [
          {
            accountId: externalAdminAccountId,
            createdAt: new Date('2024-01-01'),
            role: StudyRole.Validator,
            account: {
              id: externalAdminAccountId,
              organizationVersionId: externalOrgVersionId,
              readerOnly: false,
              user: { id: 'u1', email: 'ext@example.com', firstName: 'Ext', lastName: 'Admin', level: 'Initial' },
            },
          },
          {
            accountId: 'internal-editor-id',
            createdAt: new Date('2024-01-02'),
            role: StudyRole.Editor,
            account: {
              id: 'internal-editor-id',
              organizationVersionId: 'own-org-version-id',
              readerOnly: false,
              user: { id: 'u2', email: 'int@example.com', firstName: 'Int', lastName: 'Editor', level: 'Initial' },
            },
          },
          {
            accountId: 'external-reader-id',
            createdAt: new Date('2024-01-03'),
            role: StudyRole.Reader,
            account: {
              id: 'external-reader-id',
              organizationVersionId: externalOrgVersionId,
              readerOnly: false,
              user: { id: 'u3', email: 'ext2@example.com', firstName: 'Ext', lastName: 'Reader', level: 'Initial' },
            },
          },
        ],
        contributors: [],
      })
      const result = await mapStudyForReport(study, baseResults)
      expect(result.externalTeam).toHaveLength(2)
      expect(result.externalTeam.map((m) => m.accountId)).toContain(externalAdminAccountId)
      expect(result.externalTeam.map((m) => m.accountId)).toContain('external-reader-id')
    })

    it('does not add admin to externalTeam when admin is internal', async () => {
      const study = getMockedFullStudy({
        organizationVersionId: 'own-org-version-id',
        organizationVersion: {
          ...getMockedFullStudy().organizationVersion,
          id: 'own-org-version-id',
          parentId: null,
        },
        allowedUsers: [
          {
            accountId: 'internal-admin-id',
            createdAt: new Date('2024-01-01'),
            role: StudyRole.Validator,
            account: {
              id: 'internal-admin-id',
              organizationVersionId: 'own-org-version-id',
              readerOnly: false,
              user: { id: 'u1', email: 'int@example.com', firstName: 'Int', lastName: 'Admin', level: 'Initial' },
            },
          },
        ],
        contributors: [],
      })
      const result = await mapStudyForReport(study, baseResults)
      expect(result.externalTeam).toHaveLength(0)
    })
  })

  describe('monetary ratios', () => {
    it('calculates monetary ratios correctly', async () => {
      const mockedMonetaryRatio = 40
      const mockedNonSpecificMonetaryRatio = 10
      const result = await mapStudyForReport(getMockeFullStudy(), {
        monetaryRatio: mockedMonetaryRatio,
        nonSpecificMonetaryRatio: mockedNonSpecificMonetaryRatio,
      })
      expect(result.monetaryRatioPercentage).toBe(
        mockedMonetaryRatio.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
      )
      expect(result.specificMonetaryRatioPercentage).toBe(
        (mockedMonetaryRatio - mockedNonSpecificMonetaryRatio).toLocaleString('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }),
      )
      expect(result.nonSpecificMonetaryRatioPercentage).toBe(
        mockedNonSpecificMonetaryRatio.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
      )
    })
  })

  describe('sites', () => {
    it('maps sites correctly', async () => {
      const study = getMockeFullStudy({
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
      const result = await mapStudyForReport(study, baseResults)
      expect(result.sites).toEqual([
        { id: 'study-site-1', name: 'Site One', city: 'Paris', postalCode: '75001' },
        { id: 'study-site-2', name: 'Site Two', city: 'Lyon', postalCode: '69001' },
      ])
    })
  })

  describe('totalEtp', () => {
    it('sums etp across all sites', async () => {
      const study = getMockedFullStudy({
        sites: [
          getMockedFullStudySite({ etp: 10 }),
          getMockedFullStudySite({ etp: 5 }),
          getMockedFullStudySite({ etp: 3 }),
        ],
      })
      const result = await mapStudyForReport(study, baseResults)
      expect(result.totalEtp).toBe(18)
    })

    it('returns empty string when there are no sites', async () => {
      const result = await mapStudyForReport(getMockedFullStudy({ sites: [] }), baseResults)
      expect(result.totalEtp).toBe('')
    })
  })

  describe('exportTypesList', () => {
    it('maps Beges to French label', async () => {
      const result = await mapStudyForReport(
        getMockedFullStudy({ exports: { types: [Export.Beges], control: ControlMode.Operational } }),
        baseResults,
      )
      expect(result.exportTypesList).toBe('Bilan GES Réglementaire')
    })

    it('joins multiple export types with ", "', async () => {
      const result = await mapStudyForReport(
        getMockedFullStudy({ exports: { types: [Export.Beges, Export.GHGP], control: ControlMode.Operational } }),
        baseResults,
      )
      expect(result.exportTypesList).toBe('Bilan GES Réglementaire, GHG Protocol')
    })
  })
})
