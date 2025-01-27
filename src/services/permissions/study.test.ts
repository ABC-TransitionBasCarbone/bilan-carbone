import * as dbUserModule from '@/db/user'
import { expect } from '@jest/globals'
import { Level, Prisma, Role } from '@prisma/client'
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
  role: Role.ADMIN,
  level: Level.Initial,
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
  level: Level.Initial,
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

const getMockedDbUser = (props: Partial<User>): User => ({ ...mockedDbUser, ...props })
const getMockedStudy = (props: Partial<Prisma.StudyCreateInput>) => ({ ...mockedStudy, ...props })

// mocked called function
jest.mock('@/db/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('./organization', () => ({ checkOrganization: jest.fn() }))

// mocked import problems
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../serverFunctions/emissionFactor', () => ({ getEmissionFactorByIds: jest.fn() }))

const mockGetUserByEmail = dbUserModule.getUserByEmail as jest.Mock
const mockCheckOrganization = organizationModule.checkOrganization as jest.Mock

const advancedStudy = getMockedStudy({ level: Level.Advanced }) as Prisma.StudyCreateInput
const standardStudy = getMockedStudy({ level: Level.Standard }) as Prisma.StudyCreateInput
const initialStudy = getMockedStudy({ level: Level.Initial }) as Prisma.StudyCreateInput

describe('Study permissions service', () => {
  describe('canCreateStudy', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockCheckOrganization.mockResolvedValue(true)
    })

    describe('"Advanced" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedDbUser({ level: Level.Advanced }))
      })

      it('User should be able to create an "Advanced" study', async () => {
        const result = await canCreateStudy(mockedUser, advancedStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create a "Standard" study', async () => {
        const result = await canCreateStudy(mockedUser, standardStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateStudy(mockedUser, initialStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })

    describe('"Standard" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedDbUser({ level: Level.Standard }))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const result = await canCreateStudy(mockedUser, advancedStudy, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should be able to create a "Standard" study', async () => {
        const result = await canCreateStudy(mockedUser, standardStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateStudy(mockedUser, initialStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })

    describe('"Initial" level user', () => {
      beforeEach(() => {
        mockGetUserByEmail.mockResolvedValue(getMockedDbUser({ level: Level.Initial }))
      })

      it('User should not be able to create an "Advanced" study', async () => {
        const result = await canCreateStudy(mockedUser, advancedStudy, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should not be able to create a "Standard" study', async () => {
        const result = await canCreateStudy(mockedUser, standardStudy, mockedOrganizationId)
        expect(result).toBe(false)
      })

      it('User should be able to create an "Initial" study', async () => {
        const result = await canCreateStudy(mockedUser, initialStudy, mockedOrganizationId)
        expect(result).toBe(true)
      })
    })
  })
})
