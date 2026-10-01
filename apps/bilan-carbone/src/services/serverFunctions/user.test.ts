import { DeactivatableFeature, Environment, Role, UserStatus } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'

import {
  addAccount,
  getAccountByEmailAndEnvironment,
  getAccountById,
  getAccountFromUserOrganization,
  getAccountsFromOrganization,
  getAccountsFromOrganizationForActivation,
  removeOtherAccountActivation,
} from '@/db/account'
import { findCncByCncCode } from '@/db/cnc'
import {
  createOrganizationWithVersion,
  getOrganizationVersionByOrganizationIdAndEnvironment,
  getOrganizationVersionForRightsCheck,
  getRawOrganizationBySiret,
  getRawOrganizationBySiteCNC,
} from '@/db/organization'
import { addSite } from '@/db/site'
import { addUser, getUserByEmail, organizationVersionActiveAccountsCount, updateAccount, validateUser } from '@/db/user'
import {
  NOT_ASSOCIATION_SIRET,
  ORGANIZATION_ACTIVATION_IN_PROGRESS,
  REQUEST_SENT,
  UNKNOWN_SIRET_OR_CNC,
} from '@/services/permissions/check'
import { mockedOrganizationVersionId } from '@/tests/utils/models/organization'
import { mockedAccountId } from '@/tests/utils/models/user'
import { sendActivationEmail, sendActivationRequest } from '@abc-transitionbascarbone/services/email/email'
import { EMAIL_SENT, NOT_AUTHORIZED } from '@abc-transitionbascarbone/services/permissions/check'
import { mockedOrganizationId } from '@abc-transitionbascarbone/services/tests/models/organization'
import { mockedUserId } from '@abc-transitionbascarbone/services/tests/models/user'
import { getCompanyName, getValidAssociationNameBySiret } from '../associationApi'
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
jest.mock('@/db/client.server', () => ({
  prismaClient: {
    $transaction: jest.fn((callback) => callback({})),
  },
}))
jest.mock('@/db/organization')
jest.mock('@/db/site')
jest.mock('@/db/study', () => ({}))
jest.mock('@/db/user')
jest.mock('@/services/associationApi')
jest.mock('@abc-transitionbascarbone/db-common/db')
jest.mock('@abc-transitionbascarbone/services/email/email', () => ({
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
const mockGetAccountsFromOrganization = getAccountsFromOrganization as jest.Mock
const mockGetAccountsFromOrganizationForActivation = getAccountsFromOrganizationForActivation as jest.Mock
const mockGetAccountFromUserOrganization = getAccountFromUserOrganization as jest.Mock
const mockRemoveOtherAccountActivation = removeOtherAccountActivation as jest.Mock
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
const mockSendActivationEmail = sendActivationEmail as jest.Mock
const mockSendActivationRequest = sendActivationRequest as jest.Mock
const mockGetOrganizationVersionForRightsCheck = getOrganizationVersionForRightsCheck as jest.Mock
const mockOrganizationVersionActiveAccountsCount = organizationVersionActiveAccountsCount as jest.Mock
const mockActivateEmail = activateEmail as jest.Mock
const actualActivateEmail = jest.requireActual('./user').activateEmail as typeof activateEmail

const testEmail = 'test@example.com'
const testSiret = '12345678901234'
const testCNC = 'CNC123'

describe('signUpWithSiretOrCNC', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetDeactivableFeatureRestrictions.mockResolvedValue({ active: false })
    mockGetAccountsFromOrganization.mockResolvedValue([])
    mockGetAccountsFromOrganizationForActivation.mockResolvedValue([])
    mockRemoveOtherAccountActivation.mockResolvedValue(true)
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

  describe('activateEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('blocks self activation while another manager activation is still reserved', async () => {
      mockGetUserByEmail.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        accounts: [{ id: mockedAccountId, environment: Environment.CUT, status: UserStatus.PENDING_REQUEST }],
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.PENDING_REQUEST,
        role: Role.DEFAULT,
        user: {
          id: mockedUserId,
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
        },
      })
      mockGetOrganizationVersionForRightsCheck.mockResolvedValue({
        id: mockedOrganizationVersionId,
        activatedLicence: [1],
      })
      mockOrganizationVersionActiveAccountsCount.mockResolvedValue(0)
      mockGetAccountsFromOrganizationForActivation.mockResolvedValue([
        {
          id: 'reserved-account-id',
          role: Role.GESTIONNAIRE,
          status: UserStatus.VALIDATED,
          activationRequestedAt: new Date(),
          user: { email: 'reserved@example.com', firstName: 'Reserved', lastName: 'User' },
        },
      ])

      const result = await actualActivateEmail(testEmail, Environment.CUT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(ORGANIZATION_ACTIVATION_IN_PROGRESS)
      }
      expect(mockValidateUser).not.toHaveBeenCalled()
      expect(mockUpdateAccount).not.toHaveBeenCalled()
    })

    it('hands off expired manager activation to the new requester', async () => {
      mockGetUserByEmail.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        accounts: [{ id: mockedAccountId, environment: Environment.CUT, status: UserStatus.PENDING_REQUEST }],
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.PENDING_REQUEST,
        role: Role.DEFAULT,
        user: {
          id: mockedUserId,
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
        },
      })
      mockGetOrganizationVersionForRightsCheck.mockResolvedValue({
        id: mockedOrganizationVersionId,
        activatedLicence: [1],
      })
      mockOrganizationVersionActiveAccountsCount.mockResolvedValue(0)
      const expiredAccount = {
        id: 'expired-account-id',
        role: Role.GESTIONNAIRE,
        status: UserStatus.VALIDATED,
        activationRequestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        user: { email: 'expired@example.com', firstName: 'Expired', lastName: 'User' },
      }
      mockGetAccountsFromOrganizationForActivation.mockResolvedValue([expiredAccount])
      mockRemoveOtherAccountActivation.mockResolvedValue(true)
      mockValidateUser.mockResolvedValue(undefined)

      const result = await actualActivateEmail(testEmail, Environment.CUT)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(EMAIL_SENT)
      }
      expect(mockRemoveOtherAccountActivation).toHaveBeenCalledWith(
        { id: mockedAccountId, organizationVersionId: mockedOrganizationVersionId },
        expiredAccount,
        expect.anything(),
      )
      expect(mockUpdateAccount).toHaveBeenCalledWith(
        mockedAccountId,
        {
          activationRequestedAt: expect.any(Date),
        },
        undefined,
        expect.anything(),
      )
      expect(mockValidateUser).toHaveBeenCalledWith(mockedAccountId, expect.anything())
    })

    it('hands off an expired admin activation to the new requester', async () => {
      mockGetUserByEmail.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        accounts: [{ id: mockedAccountId, environment: Environment.CUT, status: UserStatus.PENDING_REQUEST }],
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.PENDING_REQUEST,
        role: Role.DEFAULT,
        user: {
          id: mockedUserId,
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
        },
      })
      mockGetOrganizationVersionForRightsCheck.mockResolvedValue({
        id: mockedOrganizationVersionId,
        activatedLicence: [1],
      })
      mockOrganizationVersionActiveAccountsCount.mockResolvedValue(0)
      const expiredAccount = {
        id: 'expired-admin-account-id',
        role: Role.ADMIN,
        status: UserStatus.VALIDATED,
        activationRequestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        user: { email: 'expired-admin@example.com', firstName: 'Expired', lastName: 'Admin' },
      }
      mockGetAccountsFromOrganizationForActivation.mockResolvedValue([expiredAccount])
      mockRemoveOtherAccountActivation.mockResolvedValue(true)
      mockValidateUser.mockResolvedValue(undefined)

      const result = await actualActivateEmail(testEmail, Environment.CUT)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(EMAIL_SENT)
      }
      expect(mockRemoveOtherAccountActivation).toHaveBeenCalledWith(
        { id: mockedAccountId, organizationVersionId: mockedOrganizationVersionId },
        expiredAccount,
        expect.anything(),
      )
      expect(mockUpdateAccount).toHaveBeenCalledWith(
        mockedAccountId,
        {
          activationRequestedAt: expect.any(Date),
        },
        undefined,
        expect.anything(),
      )
      expect(mockValidateUser).toHaveBeenCalledWith(mockedAccountId, expect.anything())
    })

    it('blocks activation when the transactional handoff loses the race', async () => {
      mockGetUserByEmail.mockResolvedValue({
        id: mockedUserId,
        email: testEmail,
        firstName: 'Test',
        lastName: 'User',
        accounts: [{ id: mockedAccountId, environment: Environment.CUT, status: UserStatus.PENDING_REQUEST }],
      })
      mockGetAccountById.mockResolvedValue({
        id: mockedAccountId,
        organizationVersionId: mockedOrganizationVersionId,
        status: UserStatus.PENDING_REQUEST,
        role: Role.DEFAULT,
        user: {
          id: mockedUserId,
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
        },
      })
      mockGetOrganizationVersionForRightsCheck.mockResolvedValue({
        id: mockedOrganizationVersionId,
        activatedLicence: [1],
      })
      mockOrganizationVersionActiveAccountsCount.mockResolvedValue(0)
      mockGetAccountsFromOrganizationForActivation.mockResolvedValue([
        {
          id: 'expired-account-id',
          role: Role.GESTIONNAIRE,
          status: UserStatus.VALIDATED,
          activationRequestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          user: { email: 'expired@example.com', firstName: 'Expired', lastName: 'User' },
        },
      ])
      mockRemoveOtherAccountActivation.mockResolvedValue(false)

      const result = await actualActivateEmail(testEmail, Environment.CUT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(ORGANIZATION_ACTIVATION_IN_PROGRESS)
      }
      expect(mockValidateUser).not.toHaveBeenCalled()
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
        status: UserStatus.PENDING_REQUEST,
      })
      mockActivateEmail.mockResolvedValue({ success: true, data: REQUEST_SENT })
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
        role: Role.DEFAULT,
        organizationVersion: { environment: Environment.TILT, organizationId: mockedOrganizationId },
        user: {
          id: mockedUserId,
          email: testEmail,
          firstName: 'Test',
          lastName: 'User',
        },
      })
      mockGetOrganizationVersionForRightsCheck.mockResolvedValue({
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
            status: UserStatus.IMPORTED,
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
        status: UserStatus.IMPORTED,
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
        role: Role.DEFAULT,
        organizationVersionId: mockedOrganizationVersionId,
        organizationVersion: { environment: Environment.CUT, organizationId: mockedOrganizationId },
        user: { email: testEmail, firstName: 'Test', lastName: 'User' },
      })
      mockGetAccountsFromOrganization.mockResolvedValue([
        {
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
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
      expect(mockUpdateAccount).toHaveBeenCalledWith(
        mockedAccountId,
        {
          role: Role.DEFAULT,
          status: UserStatus.PENDING_REQUEST,
          organizationVersion: { connect: { id: mockedOrganizationVersionId } },
          activationRequestedAt: null,
        },
        undefined,
        expect.anything(),
      )
    })

    it('promotes and activates the requester after an expired reservation is handed off', async () => {
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
      mockGetOrganizationVersionByOrganizationIdAndEnvironment.mockResolvedValue({ id: mockedOrganizationVersionId })
      const expiredReservation = {
        id: 'expired-account-id',
        role: Role.GESTIONNAIRE,
        status: UserStatus.VALIDATED,
        activationRequestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        user: { email: 'expired@example.com', firstName: 'Expired', lastName: 'User' },
      }
      mockGetAccountsFromOrganizationForActivation.mockResolvedValue([expiredReservation])
      mockGetAccountsFromOrganization.mockResolvedValue([])
      mockRemoveOtherAccountActivation.mockResolvedValue(true)

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.CUT)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(EMAIL_SENT)
      }
      expect(mockRemoveOtherAccountActivation).toHaveBeenCalledWith(
        { id: mockedAccountId, organizationVersionId: mockedOrganizationVersionId },
        expiredReservation,
        expect.anything(),
      )
      expect(mockGetAccountsFromOrganization).toHaveBeenCalledWith(mockedOrganizationVersionId, expect.anything())
      expect(mockUpdateAccount).toHaveBeenCalledWith(
        mockedAccountId,
        {
          role: Role.ADMIN,
          status: UserStatus.VALIDATED,
          organizationVersion: { connect: { id: mockedOrganizationVersionId } },
          activationRequestedAt: expect.any(Date),
        },
        undefined,
        expect.anything(),
      )
      expect(mockSendActivationEmail).toHaveBeenCalledWith(testEmail, expect.anything(), false, Environment.CUT)
      expect(mockSendActivationRequest).not.toHaveBeenCalled()
    })

    it('returns ORGANIZATION_ACTIVATION_IN_PROGRESS when another user started activating the organization recently', async () => {
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
        organizationVersionId: mockedOrganizationVersionId,
        organizationVersion: { environment: Environment.CUT, organizationId: mockedOrganizationId },
        user: { email: testEmail, firstName: 'Test', lastName: 'User' },
      })
      mockGetAccountsFromOrganizationForActivation.mockResolvedValue([
        {
          id: 'reserved-account-id',
          role: Role.GESTIONNAIRE,
          status: UserStatus.VALIDATED,
          activationRequestedAt: new Date(),
          user: { email: 'reserved@example.com', firstName: 'Reserved', lastName: 'User' },
        },
      ])

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.TILT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errorMessage).toBe(ORGANIZATION_ACTIVATION_IN_PROGRESS)
      }
      expect(mockSendActivationRequest).not.toHaveBeenCalled()
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

      expect(mockUpdateAccount).toHaveBeenCalledWith(
        mockedAccountId,
        expect.objectContaining({
          role: Role.GESTIONNAIRE,
          status: UserStatus.VALIDATED,
          organizationVersion: { connect: { id: mockedOrganizationVersionId } },
          activationRequestedAt: expect.any(Date),
        }),
        undefined,
        expect.anything(),
      )
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
        role: Role.DEFAULT,
        organizationVersionId: mockedOrganizationVersionId,
        organizationVersion: { environment: Environment.CUT, organizationId: mockedOrganizationId },
        user: { email: testEmail },
      })
      mockGetAccountsFromOrganization.mockResolvedValue([
        {
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          user: { email: 'admin@example.com' },
        },
      ])

      const result = await signUpWithSiretOrCNC(testEmail, testSiret, Environment.CUT)

      expect(mockUpdateAccount).toHaveBeenCalledWith(
        mockedAccountId,
        {
          role: Role.DEFAULT,
          status: UserStatus.PENDING_REQUEST,
          organizationVersion: { connect: { id: mockedOrganizationVersionId } },
          activationRequestedAt: null,
        },
        undefined,
        expect.anything(),
      )
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
        role: Role.DEFAULT,
        organizationVersionId: mockedOrganizationVersionId,
        organizationVersion: { environment: Environment.CUT, organizationId: mockedOrganizationId },
        user: { email: testEmail, firstName: 'Test', lastName: 'User' },
      })
      mockGetAccountsFromOrganization.mockResolvedValue([
        {
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          user: { email: 'admin@example.com' },
        },
        {
          role: Role.GESTIONNAIRE,
          status: UserStatus.ACTIVE,
          user: { email: 'gestionnaire@example.com' },
        },
        {
          role: Role.DEFAULT,
          status: UserStatus.ACTIVE,
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

      expect(mockUpdateAccount).toHaveBeenCalledWith(
        mockedAccountId,
        expect.objectContaining({
          role: Role.ADMIN,
          status: UserStatus.VALIDATED,
          activationRequestedAt: expect.any(Date),
        }),
        undefined,
        expect.anything(),
      )
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(EMAIL_SENT)
      }
    })
  })
})
