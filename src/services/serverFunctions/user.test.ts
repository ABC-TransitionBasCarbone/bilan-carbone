import { expect } from '@jest/globals'
import { DeactivatableFeature, Environment, Role, UserStatus } from '@prisma/client'

import {
  addAccount,
  getAccountByEmailAndEnvironment,
  getAccountById,
  getAccountFromUserOrganization,
} from '@/db/account'
import { findCncByCncCode } from '@/db/cnc'
import {
  createOrganizationWithVersion,
  getOrganizationVersionById,
  getOrganizationVersionByOrganizationIdAndEnvironment,
  getRawOrganizationBySiret,
  getRawOrganizationBySiteCNC,
} from '@/db/organization'
import { addSite } from '@/db/site'
import { addUser, getUserByEmail, organizationVersionActiveAccountsCount, updateAccount, validateUser } from '@/db/user'
import {
  EMAIL_SENT,
  NOT_ASSOCIATION_SIRET,
  NOT_AUTHORIZED,
  REQUEST_SENT,
  UNKNOWN_SIRET_OR_CNC,
} from '@/services/permissions/check'
import { mockedOrganizationId, mockedOrganizationVersionId } from '@/tests/utils/models/organization'
import { mockedAccountId, mockedUserId } from '@/tests/utils/models/user'
import { getCompanyName, getValidAssociationNameBySiret } from '../associationApi'
import { sendActivationRequest } from '../email/email'
import { getDeactivableFeatureRestrictions } from './deactivableFeatures'
import { activateEmail, signUpWithSiretOrCNC } from './user'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('@/services/auth', () => ({
  auth: jest.fn(),
  dbActualizedAuth: jest.fn(),
}))

jest.mock('@/services/checklist', () => ({}))
jest.mock('@/db/account')
jest.mock('@/db/cnc')
jest.mock('@/db/deactivableFeatures')
jest.mock('@/db/organization')
jest.mock('@/db/site')
jest.mock('@/db/study', () => ({}))
jest.mock('@/db/user')
jest.mock('@/services/associationApi')
jest.mock('@/services/email/email', () => ({
  sendActivationEmail: jest.fn(),
  sendActivationRequest: jest.fn(),
}))
jest.mock('./deactivableFeatures')

jest.mock('./user', () => {
  const originalModule = jest.requireActual('./user')
  return {
    ...originalModule,
    activateEmail: jest.fn(),
  }
})

const mockGetDeactivableFeatureRestrictions = getDeactivableFeatureRestrictions as jest.Mock
const mockGetAccountByEmailAndEnvironment = getAccountByEmailAndEnvironment as jest.Mock
const mockGetUserByEmail = getUserByEmail as jest.Mock
const mockAddUser = addUser as jest.Mock
const mockAddAccount = addAccount as jest.Mock
const mockUpdateAccount = updateAccount as jest.Mock
const mockGetAccountById = getAccountById as jest.Mock
const mockGetAccountFromUserOrganization = getAccountFromUserOrganization as jest.Mock
const mockValidateUser = validateUser as jest.Mock
const mockFindCncByCncCode = findCncByCncCode as jest.Mock
const mockGetRawOrganizationBySiteCNC = getRawOrganizationBySiteCNC as jest.Mock
const mockGetOrganizationVersionByOrganizationIdAndEnvironment =
  getOrganizationVersionByOrganizationIdAndEnvironment as jest.Mock
const mockCreateOrganizationWithVersion = createOrganizationWithVersion as jest.Mock
const mockAddSite = addSite as jest.Mock
const mockGetRawOrganizationBySiret = getRawOrganizationBySiret as jest.Mock
const mockGetValidAssociationNameBySiret = getValidAssociationNameBySiret as jest.Mock
const mockGetCompanyName = getCompanyName as jest.Mock
const mockSendActivationRequest = sendActivationRequest as jest.Mock
const mockGetOrganizationVersionById = getOrganizationVersionById as jest.Mock
const mockOrganizationVersionActiveAccountsCount = organizationVersionActiveAccountsCount as jest.Mock
const mockActivateEmail = activateEmail as jest.Mock

const testEmail = 'test@example.com'
const testSiret = '12345678901234'
const testCNC = 'CNC123'

describe('signUpWithSiretOrCNC', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetDeactivableFeatureRestrictions.mockResolvedValue({ active: false })
    mockActivateEmail.mockResolvedValue({ success: true, data: EMAIL_SENT })
  })

  describe('Feature deactivation checks', () => {
    it('returns NOT_AUTHORIZED when creation is deactivated for environment', async () => {
      mockGetDeactivableFeatureRestrictions.mockResolvedValue({
        active: true,
        deactivatedEnvironments: [Environment.TILT],
      })

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(NOT_AUTHORIZED)
      }
      expect(mockGetDeactivableFeatureRestrictions).toHaveBeenCalledWith(DeactivatableFeature.Creation)
    })

    it('allows signup when creation is not deactivated', async () => {
      mockGetDeactivableFeatureRestrictions.mockResolvedValue({
        active: false,
      })
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetValidAssociationNameBySiret.mockResolvedValue('Test Association')
      mockCreateOrganizationWithVersion.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(result.success).toBe(true)
    })
  })

  describe('Account already exists scenarios', () => {
    it('returns NOT_AUTHORIZED when account exists for CUT environment', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.ACTIVE,
      })

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.CUT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(NOT_AUTHORIZED)
      }
    })

    it('sends activation request when TILT account exists but not active', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.IMPORTED,
      })
      mockGetUserByEmail.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        accounts: [{ id: mockedAccountId, environment: Environment.TILT, status: UserStatus.IMPORTED }],
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.IMPORTED,
        user: {
          id: mockedUserId,
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
        },
      })
      mockGetOrganizationVersionById.mockResolvedValue({
        id: mockedOrganizationVersionId,
        activatedLicence: false,
      })
      mockOrganizationVersionActiveAccountsCount.mockResolvedValue(true)
      mockGetAccountFromUserOrganization.mockResolvedValue([
        {
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          user: { email: 'admin@example.com' },
        },
      ])

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(REQUEST_SENT)
      }
      expect(mockSendActivationRequest).toHaveBeenCalledWith(
        ['admin@example.com'],
        testEmail.toLowerCase(),
        'Test User',
      )
    })

    it('returns NOT_AUTHORIZED when TILT account exists and is active', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.ACTIVE,
      })

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(NOT_AUTHORIZED)
      }
    })
  })

  describe('User creation scenarios', () => {
    it('creates new TILT user when user does not exist', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetValidAssociationNameBySiret.mockResolvedValue('Test Association')
      mockCreateOrganizationWithVersion.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(mockAddUser).toHaveBeenCalledWith({
        email: testEmail,
        firstName: '',
        lastName: '',
        accounts: {
          create: {
            status: UserStatus.PENDING_REQUEST,
            role: Role.DEFAULT,
            environment: Environment.TILT,
          },
        },
      })
      expect(mockGetValidAssociationNameBySiret).toHaveBeenCalledWith(testSiret)
      expect(mockCreateOrganizationWithVersion).toHaveBeenCalledWith(
        { wordpressId: testSiret, name: 'Test Association' },
        { environment: Environment.TILT },
      )
      expect(result.success).toBe(true)
      expect(mockActivateEmail).not.toHaveBeenCalled()
    })

    it('creates new account when user exists without account for environment', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue({ id: mockedUserId, email: testEmail })
      mockAddAccount.mockResolvedValue({ id: mockedAccountId })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetValidAssociationNameBySiret.mockResolvedValue('Test Association')
      mockCreateOrganizationWithVersion.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(mockAddAccount).toHaveBeenCalledWith({
        user: { connect: { id: mockedUserId } },
        role: Role.DEFAULT,
        environment: Environment.TILT,
        status: UserStatus.PENDING_REQUEST,
      })
      expect(mockGetValidAssociationNameBySiret).toHaveBeenCalledWith(testSiret)
      expect(result.success).toBe(true)
      expect(mockActivateEmail).not.toHaveBeenCalled()
    })
  })

  describe('CUT environment with CNC code', () => {
    it('creates organization and site when CNC exists but organization does not', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockFindCncByCncCode.mockResolvedValue({
        id: 'cnc-id',
        nom: 'Test CNC',
        codeInsee: '75001',
        commune: 'Paris',
      })
      mockGetRawOrganizationBySiteCNC.mockResolvedValue(null)
      mockGetOrganizationVersionByOrganizationIdAndEnvironment.mockResolvedValue(null)
      mockCreateOrganizationWithVersion.mockResolvedValue({
        id: mockedOrganizationVersionId,
        organizationId: mockedOrganizationId,
      })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testCNC, Environment.CUT)

      expect(mockFindCncByCncCode).toHaveBeenCalledWith(testCNC)
      expect(mockCreateOrganizationWithVersion).toHaveBeenCalledWith(
        { name: 'Test CNC' },
        { environment: Environment.CUT },
      )
      expect(mockAddSite).toHaveBeenCalledWith({
        name: 'Test CNC',
        postalCode: '75001',
        city: 'Paris',
        cnc: {
          connectOrCreate: {
            create: {},
            where: { id: 'cnc-id' },
          },
        },
        organization: { connect: { id: mockedOrganizationId } },
      })
      expect(result.success).toBe(true)
    })

    it('uses existing organization when CNC and organization exist', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        accounts: [{ id: mockedAccountId }],
      })
      mockFindCncByCncCode.mockResolvedValue({
        id: 'cnc-id',
        nom: 'Test CNC',
        codeInsee: '75001',
        commune: 'Paris',
      })
      mockGetRawOrganizationBySiteCNC.mockResolvedValue({ id: mockedOrganizationId })
      mockGetOrganizationVersionByOrganizationIdAndEnvironment.mockResolvedValue({
        id: mockedOrganizationVersionId,
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        user: { email: testEmail, firstName: 'Test', lastName: 'User' },
      })
      mockGetAccountFromUserOrganization.mockResolvedValue([
        {
          role: Role.ADMIN,
          user: { email: 'admin@example.com' },
        },
      ])

      const result = await signUpWithSiretOrCNC(testEmail, testCNC, Environment.CUT)

      expect(mockCreateOrganizationWithVersion).not.toHaveBeenCalled()
      expect(mockAddSite).not.toHaveBeenCalled()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(REQUEST_SENT)
      }
    })
  })

  describe('SIRET validation', () => {
    it('returns UNKNOWN_SIRET_OR_CNC when identifier is too short and not CNC', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockFindCncByCncCode.mockResolvedValue(null)

      const result = await signUpWithSiretOrCNC(testEmail, '12345', Environment.CUT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(UNKNOWN_SIRET_OR_CNC)
      }
    })

    it('returns NOT_ASSOCIATION_SIRET when TILT SIRET is not valid association', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetValidAssociationNameBySiret.mockResolvedValue(null)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(NOT_ASSOCIATION_SIRET)
      }
      expect(mockGetValidAssociationNameBySiret).toHaveBeenCalledWith(testSiret)
    })

    it('allows signup when TILT SIRET is valid association', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetValidAssociationNameBySiret.mockResolvedValue('Test Association')
      mockCreateOrganizationWithVersion.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(mockGetValidAssociationNameBySiret).toHaveBeenCalledWith(testSiret)
      expect(mockCreateOrganizationWithVersion).toHaveBeenCalledWith(
        { wordpressId: testSiret, name: 'Test Association' },
        { environment: Environment.TILT },
      )
      expect(result.success).toBe(true)
    })
  })

  describe('CUT environment company name lookup', () => {
    it('fetches company name for CUT environment when organization does not exist', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetCompanyName.mockResolvedValue('Test Company')
      mockCreateOrganizationWithVersion.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.CUT)

      expect(mockGetCompanyName).toHaveBeenCalledWith(testSiret)
      expect(mockCreateOrganizationWithVersion).toHaveBeenCalledWith(
        { wordpressId: testSiret, name: 'Test Company' },
        { environment: Environment.CUT },
      )
      expect(result.success).toBe(true)
    })
  })

  describe('Role assignment logic', () => {
    it('assigns ADMIN role when creating new organization', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetValidAssociationNameBySiret.mockResolvedValue('Test Association')
      mockCreateOrganizationWithVersion.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(mockUpdateAccount).toHaveBeenCalledWith(mockedAccountId, {
        role: Role.ADMIN,
        organizationVersion: { connect: { id: mockedOrganizationVersionId } },
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(EMAIL_SENT)
      }
    })

    it('assigns DEFAULT role when joining existing organization', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue({ id: mockedOrganizationId })
      mockGetOrganizationVersionByOrganizationIdAndEnvironment.mockResolvedValue({
        id: mockedOrganizationVersionId,
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        user: { email: testEmail },
      })
      mockGetAccountFromUserOrganization.mockResolvedValue([
        {
          role: Role.ADMIN,
          user: { email: 'admin@example.com' },
        },
      ])

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.CUT)

      expect(mockUpdateAccount).toHaveBeenCalledWith(mockedAccountId, {
        role: Role.DEFAULT,
        organizationVersion: { connect: { id: mockedOrganizationVersionId } },
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(REQUEST_SENT)
      }
    })
  })

  describe('Email flow scenarios', () => {
    it('sends activation request to admins when joining existing organization', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue({ id: mockedOrganizationId })
      mockGetOrganizationVersionByOrganizationIdAndEnvironment.mockResolvedValue({
        id: mockedOrganizationVersionId,
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        user: { email: testEmail, firstName: 'Test', lastName: 'User' },
      })
      mockGetAccountFromUserOrganization.mockResolvedValue([
        {
          role: Role.ADMIN,
          user: { email: 'admin@example.com' },
        },
        {
          role: Role.GESTIONNAIRE,
          user: { email: 'gestionnaire@example.com' },
        },
        {
          role: Role.DEFAULT,
          user: { email: 'member@example.com' },
        },
      ])

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.CUT)

      expect(mockSendActivationRequest).toHaveBeenCalledWith(
        ['admin@example.com', 'gestionnaire@example.com'],
        testEmail.toLowerCase(),
        'Test User',
        Environment.CUT,
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(REQUEST_SENT)
      }
    })

    it('validates user and sends activation when creating new organization', async () => {
      mockGetAccountByEmailAndEnvironment.mockResolvedValue(null)
      mockGetUserByEmail.mockResolvedValue(null)
      mockAddUser.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        accounts: [{ id: mockedAccountId }],
      })
      mockGetRawOrganizationBySiret.mockResolvedValue(null)
      mockGetCompanyName.mockResolvedValue('Test Company')
      mockCreateOrganizationWithVersion.mockResolvedValue({ id: mockedOrganizationVersionId })
      mockValidateUser.mockResolvedValue(undefined)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.CUT)

      expect(mockValidateUser).toHaveBeenCalledWith(mockedAccountId)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(EMAIL_SENT)
      }
    })
  })
})
