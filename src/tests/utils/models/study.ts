// TO DELETE ts-nockeck
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { FullStudy } from '@/db/study'
import { Level, Prisma, Study, StudyResultUnit } from '@prisma/client'
import { mockedOrganization, mockedOrganizationId } from './organization'
import { mockedUser } from './user'

export const mockedStudy = {
  id: 'mocked-study-id',
  name: 'Mocked Study',
  startDate: new Date('2025-01-01T00:00:00.000Z'),
  endDate: new Date('2025-01-01T00:00:00.000Z'),
  isPublic: true,
  level: Level.Initial,
  createdById: mockedUser.id,
  organizationId: mockedOrganizationId,
  resultsUnit: StudyResultUnit.K,
}

export const mockedDdStudy = {
  ...mockedStudy,
  oldBCId: null,
  realizationStartDate: null,
  realizationEndDate: null,
  numberOfSessions: null,
  numberOfTickets: null,
  numberOfOpenDays: null,
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
  organization: mockedOrganization,
  openingHours: [],
}

export const mockedStudySite = {
  id: 'mocked-study-site-id',
  etp: 1,
  ca: 1,
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
  organization: { connect: { id: mockedOrganizationId } },
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
