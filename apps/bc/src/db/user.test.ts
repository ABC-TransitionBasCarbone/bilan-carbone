import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment, Level, Role, UserChecklist, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { prismaClient } from './client.server'
import { updateUserPasswordForEmail } from './user'

const mockTransaction = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  account: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
  userCheckedStep: { upsert: jest.fn() },
}

jest.mock('./client.server', () => ({
  prismaClient: { $transaction: jest.fn((callback) => callback(mockTransaction)) },
}))
jest.mock('@/services/serverFunctions/user', () => ({}))
jest.mock('@/services/serverFunctions/deactivableFeatures', () => ({}))
jest.mock('@abc-transitionbascarbone/common/utils/auth', () => ({
  signPassword: jest.fn().mockResolvedValue('hashed-password'),
}))

describe('updateUserPasswordForEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.account.update.mockReset()
    mockTransaction.user.findUnique.mockResolvedValue({ id: 'user-id', level: Level.Initial })
    mockTransaction.user.update.mockResolvedValue({ id: 'user-id' })
    mockTransaction.account.findFirst.mockResolvedValue({
      id: 'account-id',
      environment: Environment.TILT,
      status: UserStatus.VALIDATED,
      role: Role.DEFAULT,
      organizationVersionId: 'organization-version-id',
    })
    mockTransaction.account.findMany.mockResolvedValue([])
    mockTransaction.account.count.mockResolvedValue(0)
  })

  it.each([
    [Environment.BC, Level.Initial, Role.ADMIN],
    [Environment.BC, Level.Advanced, Role.ADMIN],
    [Environment.BC, null, Role.GESTIONNAIRE],
    [Environment.TILT, Level.Initial, Role.ADMIN],
    [Environment.TILT, Level.Advanced, Role.ADMIN],
    [Environment.TILT, null, Role.GESTIONNAIRE],
  ])('gives the first %s member with level %s the role %s', async (environment, level, role) => {
    mockTransaction.user.findUnique.mockResolvedValue({ id: 'user-id', level })

    await updateUserPasswordForEmail('user@example.com', 'password', environment)

    expect(mockTransaction.account.count).toHaveBeenCalledWith({
      where: { organizationVersionId: 'organization-version-id', status: UserStatus.ACTIVE },
    })
    expect(mockTransaction.account.update).toHaveBeenCalledWith({
      where: { userId_environment: { userId: 'user-id', environment } },
      data: { activationRequestedAt: null, status: UserStatus.ACTIVE, role },
    })
    expect(mockTransaction.user.update).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      data: { resetToken: null, password: 'hashed-password' },
    })
    expect(prismaClient.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
  })

  it('reuses a provided transaction', async () => {
    await updateUserPasswordForEmail(
      'user@example.com',
      'password',
      Environment.TILT,
      mockTransaction as unknown as Prisma.TransactionClient,
    )

    expect(prismaClient.$transaction).not.toHaveBeenCalled()
    expect(mockTransaction.user.update).toHaveBeenCalled()
  })

  it('preserves the role when joining an organization with active members', async () => {
    mockTransaction.account.count.mockResolvedValue(1)

    await updateUserPasswordForEmail('user@example.com', 'password', Environment.TILT)

    expect(mockTransaction.account.update.mock.calls[0][0].data).not.toHaveProperty('role')
  })

  it.each([Role.ADMIN, Role.GESTIONNAIRE, Role.COLLABORATOR])(
    'preserves an explicitly assigned %s role',
    async (role) => {
      mockTransaction.account.findFirst.mockResolvedValue({
        id: 'account-id',
        status: UserStatus.VALIDATED,
        role,
        organizationVersionId: 'organization-version-id',
      })

      await updateUserPasswordForEmail('user@example.com', 'password', Environment.TILT)

      expect(mockTransaction.account.update.mock.calls[0][0].data).not.toHaveProperty('role')
      expect(mockTransaction.account.count).not.toHaveBeenCalled()
    },
  )

  it.each([
    [Environment.TILT, UserStatus.ACTIVE, 'organization-version-id'],
    [Environment.TILT, UserStatus.VALIDATED, null],
    [Environment.CUT, UserStatus.VALIDATED, 'organization-version-id'],
    [Environment.CLICKSON, UserStatus.VALIDATED, 'organization-version-id'],
    [Environment.MIP, UserStatus.VALIDATED, 'organization-version-id'],
    [Environment.COURSE_BC, UserStatus.VALIDATED, 'organization-version-id'],
    [Environment.COURSE_TILT, UserStatus.VALIDATED, 'organization-version-id'],
  ])(
    'does not promote a %s account with status %s and organization %s',
    async (environment, status, organizationVersionId) => {
      mockTransaction.account.findFirst.mockResolvedValue({
        id: 'account-id',
        status,
        role: Role.DEFAULT,
        organizationVersionId,
      })

      await updateUserPasswordForEmail('user@example.com', 'password', environment)

      expect(mockTransaction.account.update.mock.calls[0][0].data).not.toHaveProperty('role')
      expect(mockTransaction.account.count).not.toHaveBeenCalled()
    },
  )

  it('still records checklist steps for authorized BC accounts', async () => {
    mockTransaction.account.findMany.mockResolvedValue([{ id: 'bc-account-id', environment: Environment.BC }])

    await updateUserPasswordForEmail('user@example.com', 'password', Environment.TILT)

    expect(mockTransaction.userCheckedStep.upsert).toHaveBeenCalledWith({
      where: { accountId_step: { accountId: 'bc-account-id', step: UserChecklist.CreateAccount } },
      update: {},
      create: { accountId: 'bc-account-id', step: UserChecklist.CreateAccount },
    })
  })

  it('rejects a missing user before writing anything', async () => {
    mockTransaction.user.findUnique.mockResolvedValue(null)

    await expect(updateUserPasswordForEmail('missing@example.com', 'password', Environment.TILT)).rejects.toThrow(
      'User with email missing@example.com not found',
    )

    expect(mockTransaction.user.update).not.toHaveBeenCalled()
    expect(mockTransaction.account.update).not.toHaveBeenCalled()
  })

  it('rejects an unauthorized account before consuming its token or updating its password', async () => {
    mockTransaction.account.findFirst.mockResolvedValue(null)

    await expect(updateUserPasswordForEmail('user@example.com', 'password', Environment.TILT)).rejects.toThrow(
      'Account with email user@example.com for environment TILT not found or has a wrong status',
    )

    expect(mockTransaction.account.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-id',
        environment: Environment.TILT,
        status: { in: [UserStatus.VALIDATED, UserStatus.ACTIVE] },
      },
    })
    expect(mockTransaction.user.update).not.toHaveBeenCalled()
    expect(mockTransaction.account.update).not.toHaveBeenCalled()
  })

  it('propagates transaction failures instead of reporting successful activation', async () => {
    mockTransaction.account.update.mockRejectedValue(new Error('Activation failed'))

    await expect(updateUserPasswordForEmail('user@example.com', 'password', Environment.TILT)).rejects.toThrow(
      'Activation failed',
    )
  })
})
