import { FullStudy } from '@/db/study'
import { ControlMode, Export, Import, Level, Prisma, Study, StudyResultUnit, StudyRole } from '@prisma/client'
import { mockedOrganizationVersion, mockedOrganizationVersionId } from './organization'
import { mockedAccountId, mockedUser } from './user'

export const mockedStudy = {
  id: 'mocked-study-id',
  name: 'Mocked Study',
  startDate: new Date('2025-01-01T00:00:00.000Z'),
  endDate: new Date('2025-01-01T00:00:00.000Z'),
  isPublic: true,
  level: Level.Initial,
  createdById: mockedUser.id,
  createdBy: mockedAccountId,
  organizationVersionId: mockedOrganizationVersionId,
  resultsUnit: StudyResultUnit.K,
}

export const mockedDdStudy = {
  ...mockedStudy,
  oldBCId: null,
  realizationStartDate: null,
  realizationEndDate: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

export const mockedFullStudy = {
  ...mockedDdStudy,
  emissionSources: [],
  contributors: [],
  allowedUsers: [],
  sites: [],
  emissionFactorVersions: [],
  exports: [],
  organizationVersion: mockedOrganizationVersion,
  emissionSourceTagFamilies: [],
}

export const mockedStudySite = {
  id: 'mocked-study-site-id',
  etp: 1,
  ca: 1,
  numberOfSessions: null,
  numberOfTickets: null,
  numberOfOpenDays: null,
  distanceToParis: null,
  openingHours: [],
  volunteerNumber: 0,
  beneficiaryNumber: 0,
}

export const mockedDbStudySite = {
  ...mockedStudySite,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  site: { connect: { id: 'mocked-site-id' } },
  study: { connect: { id: mockedDdStudy.id } },
}

export const mockedDbFullStudySite = {
  ...mockedStudySite,
  site: {
    id: 'mocked-site-id',
    name: 'Mocked Site',
    postalCode: null,
    city: null,
    cnc: null,
  },
}

export const getMockedStudy = (
  props?: Partial<Prisma.StudyCreateInput> & {
    createdAt?: Date
    updatedAt?: Date
    startDate?: Date
    endDate?: Date
    realizationStartDate?: Date
    realizationEndDate?: Date
  },
): Study => ({ ...mockedDdStudy, ...props })

export const getMockedFullStudy = (props?: Partial<FullStudy>): FullStudy => ({
  ...mockedFullStudy,
  ...props,
})

export const getMockedStudyCreateInput = (props: Partial<Prisma.StudyCreateInput>): Prisma.StudyCreateInput => ({
  ...mockedDdStudy,
  organizationVersion: { connect: { id: mockedOrganizationVersionId } },
  createdBy: { connect: { id: mockedUser.id } },
  ...props,
})

export const getMockedStudySite = (
  props?: Partial<Prisma.StudySiteCreateInput> & {
    createdAt?: Date
    updatedAt?: Date
    id: string
  },
): Prisma.StudySiteCreateInput & { id: string } => ({
  ...mockedDbStudySite,
  ...props,
  openingHours: props?.openingHours ?? undefined,
})

export const getMockedFullStudySite = (
  props?: Partial<FullStudy['sites'][0]> & {
    createdAt?: Date
    updatedAt?: Date
  },
): FullStudy['sites'][0] => ({
  ...mockedDbFullStudySite,
  ...props,
})

export const getMockedFormSite = (id: string, name: string, overrides = {}) => ({
  id,
  name,
  selected: false,
  ca: 0,
  etp: 0,
  emissionSourcesCount: 0,
  ...overrides,
})

export const getMockedDetailedFullStudySite = (
  siteId: string,
  studySiteId: string,
  name: string,
  overrides = {},
): FullStudy['sites'][0] => ({
  ...getMockedFullStudySite({
    id: studySiteId,
    etp: 10,
    ca: 50000,
    site: {
      id: siteId,
      name,
      postalCode: '12345',
      city: 'Test City',
      cnc: {
        id: '1',
        numberOfProgrammedFilms: 10,
        ecrans: 13,
      },
    },
    ...overrides,
  }),
})

export const COMMON_DATES = {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  realizationStartDate: new Date('2024-02-01'),
  realizationEndDate: new Date('2024-11-30'),
}

export const COMMON_DATES_STR = {
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  realizationStartDate: '2024-02-01',
  realizationEndDate: '2024-11-30',
}

export const TEST_IDS = {
  sourceStudy: 'source-study-id',
  newStudy: 'new-study-id',
  orgVersion: 'org-version-id',
  studySite: 'study-site-id',
  newStudySite: 'new-study-site-id',
  site: 'site-id',
  emissionSource: 'emission-source-id',
  emissionFactor: 'emission-factor-id',
  importVersion: 'import-version-id',
  userStudy: 'user-study-id',
  contributorStudy: 'contributor-study-id',
  account: 'account-id',
}

export const TEST_EMAILS = {
  currentUser: 'current@example.com',
  validator: 'validator@example.com',
  teamMember: 'team@example.com',
  contributor: 'contributor@example.com',
}

export const getMockedDuplicateStudyCommand = (overrides = {}) => ({
  name: 'Duplicated Study',
  organizationVersionId: TEST_IDS.orgVersion,
  validator: TEST_EMAILS.validator,
  isPublic: 'false',
  level: 'Initial' as const,
  sites: [],
  exports: {
    Beges: false,
    GHGP: false,
    ISO14069: false,
  },
  ...COMMON_DATES_STR,
  ...overrides,
})

export const getMockeFullStudy = (overrides = {}) => ({
  id: TEST_IDS.sourceStudy,
  name: 'Source Study',
  resultsUnit: StudyResultUnit.K,
  organizationVersionId: TEST_IDS.orgVersion,
  exports: [{ type: Export.Beges, control: ControlMode.Operational }],
  emissionFactorVersions: [
    {
      source: Import.BaseEmpreinte,
      importVersionId: TEST_IDS.importVersion,
    },
  ],
  emissionSources: [
    {
      id: TEST_IDS.emissionSource,
      name: 'Test Emission Source',
      value: 100,
      studySite: {
        id: TEST_IDS.studySite,
        site: { id: TEST_IDS.site, name: 'Test Site' },
      },
      emissionFactor: { id: TEST_IDS.emissionFactor },
    },
  ],
  allowedUsers: [
    {
      id: TEST_IDS.userStudy,
      account: { user: { email: TEST_EMAILS.teamMember } },
      role: StudyRole.Editor,
    },
  ],
  contributors: [
    {
      id: TEST_IDS.contributorStudy,
      account: { user: { email: TEST_EMAILS.contributor } },
      subPost: 'test-subpost',
    },
  ],
  ...overrides,
})
