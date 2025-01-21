import * as dbUserModule from '@/db/user'
import { expect } from '@jest/globals'
import { Level, Prisma } from '@prisma/client'
import { User } from 'next-auth'
import * as organizationModule from './organization'
import { canCreateStudy } from './study'

const mockedUserId = 'mocked-user-id'
const mockedOrganizationId = 'mocked-organization-id'

const mockedUser = {
  id: '6d2af85f-f6f8-42ec-9fa4-965405e52d12',
  email: 'mocked@email.com',
  firstName: 'Mocke',
  lastName: 'User',
  organizationId: mockedOrganizationId,
  role: 'ADMIN',
}
const mockedDbUser = {
  ...mockedUser,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  isActive: true,
  isValidated: true,
}
const mockedStudy = {
  name: 'Mocked Study',
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-01-01T00:00:00Z',
  isPublic: true,
  exports: { createMany: { data: [] } },
  createdBy: { connect: { id: mockedUserId } },
  organization: { connect: { id: mockedOrganizationId } },
  version: { connect: { id: 'mocked-version-id' } },
  allowedUsers: { createMany: { data: [{ role: 'Validator', userId: mockedUserId }] } },
  sites: {
    createMany: {
      data: [{ siteId: 'mocked-site-id', etp: 64, ca: 6906733.42 }],
    },
  },
}

const getMockedLeveledUser = (level: Level) => ({ ...mockedUser, level })
const getMockedLeveledDbUser = (level: Level) => ({ ...mockedDbUser, level })
const getMockedLeveledStudy = (level: Level) => ({ ...mockedStudy, level })

// mocked called function
jest.mock('@/db/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('./organization', () => ({ checkOrganization: jest.fn() }))

// mocked import problems
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../serverFunctions/emissionFactor', () => ({ getEmissionFactorByIds: jest.fn() }))

const mockGetUserByEmail = dbUserModule.getUserByEmail as jest.Mock
const mockCheckOrganization = organizationModule.checkOrganization as jest.Mock

describe('Study permissions service', () => {
  describe('canCreateStudy', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockCheckOrganization.mockResolvedValue(true)
    })

    describe('"Advanced" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedLeveledDbUser(Level.Advanced))
      })

      it('User should be able to create an "Advanced" study', async () => {
        const study = getMockedLeveledStudy(Level.Advanced) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Advanced) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create a "Standard" study', async () => {
        const study = getMockedLeveledStudy(Level.Standard) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Advanced) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const study = getMockedLeveledStudy(Level.Advanced) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Advanced) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })

    describe('"Standard" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedLeveledDbUser(Level.Standard))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const study = getMockedLeveledStudy(Level.Advanced) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Standard) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should be able to create a "Standard" study', async () => {
        const study = getMockedLeveledStudy(Level.Standard) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Standard) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const study = getMockedLeveledStudy(Level.Initial) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Standard) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })

    describe('"Initial" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedLeveledDbUser(Level.Initial))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const study = getMockedLeveledStudy(Level.Advanced) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Initial) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should not be able to create a "Standard" study', async () => {
        const study = getMockedLeveledStudy(Level.Standard) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Initial) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should be able to create an "Initial" study', async () => {
        const study = getMockedLeveledStudy(Level.Initial) as Prisma.StudyCreateInput
        const user = getMockedLeveledUser(Level.Initial) as User
        const result = await canCreateStudy(user, study, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })
  })
})
