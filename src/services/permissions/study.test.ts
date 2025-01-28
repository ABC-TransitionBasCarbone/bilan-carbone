import * as dbUserModule from '@/db/user'
import { getMockedDbUser, getMockedStudy, mockedOrganizationId } from '@/tests/utils/models'
import { expect } from '@jest/globals'
import { Level } from '@prisma/client'
import * as organizationModule from './organization'
import { canCreateStudy } from './study'

// mocked called function
jest.mock('@/db/user', () => ({ getUserByEmail: jest.fn() }))
jest.mock('./organization', () => ({ checkOrganization: jest.fn() }))

// mocked import problems
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../serverFunctions/emissionFactor', () => ({ getEmissionFactorByIds: jest.fn() }))

const mockGetUserByEmail = dbUserModule.getUserByEmail as jest.Mock
const mockCheckOrganization = organizationModule.checkOrganization as jest.Mock

const advancedStudy = getMockedStudy({ level: Level.Advanced })
const standardStudy = getMockedStudy({ level: Level.Standard })
const initialStudy = getMockedStudy({ level: Level.Initial })

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
})
