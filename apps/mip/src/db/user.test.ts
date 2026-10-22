import { Environment, UserStatus } from '@abc-transitionbascarbone/common/db/enums'
import { expect, it } from '@jest/globals'
import { prismaClient } from './client.server'
import { updateUserPasswordForEmail } from './user'

const mockTransaction = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  accountMip: { findUnique: jest.fn(), updateMany: jest.fn() },
}

jest.mock('./client.server', () => ({
  prismaClient: { $transaction: jest.fn((callback) => callback(mockTransaction)) },
}))

jest.mock('@/services/serverFunctions/user', () => ({ sendEmailToAddedUser: jest.fn() }))
jest.mock('@/utils/userAccounts', () => ({ userSessionToDbUser: jest.fn() }))
jest.mock('./accountMip', () => ({
  addAccountMip: jest.fn(),
  getAccountMipByEmailAndOrganizationVersionMipId: jest.fn(),
  updateAccountMip: jest.fn(),
}))
jest.mock('@abc-transitionbascarbone/common/utils/auth', () => {
  const actual = jest.requireActual('@abc-transitionbascarbone/common/utils/auth')
  return { ...actual, signPassword: jest.fn().mockResolvedValue('hashed-password') }
})

describe('updateUserPasswordForEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction.user.findUnique.mockResolvedValue({ id: 'user-id' })
    mockTransaction.user.update.mockResolvedValue({ id: 'user-id' })
    mockTransaction.accountMip.findUnique.mockResolvedValue({
      id: 'account-mip-id',
      status: UserStatus.VALIDATED,
    })
    mockTransaction.accountMip.updateMany.mockResolvedValue({ count: 1 })
  })

  it('updates the password and activates only the validated MIP account', async () => {
    await updateUserPasswordForEmail('user@example.com', 'password')

    expect(mockTransaction.accountMip.findUnique).toHaveBeenCalledWith({
      where: { userId_environment: { userId: 'user-id', environment: Environment.MIP } },
    })
    expect(mockTransaction.user.update).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      data: { resetToken: null, password: 'hashed-password' },
    })
    expect(mockTransaction.accountMip.updateMany).toHaveBeenCalledWith({
      where: { id: 'account-mip-id', status: { in: [UserStatus.VALIDATED, UserStatus.ACTIVE] } },
      data: { status: UserStatus.ACTIVE },
    })
    expect(prismaClient.$transaction).toHaveBeenCalledWith(expect.any(Function))
  })

  it('does not change the status of an already active account', async () => {
    mockTransaction.accountMip.findUnique.mockResolvedValue({
      id: 'account-mip-id',
      status: UserStatus.ACTIVE,
    })

    await updateUserPasswordForEmail('user@example.com', 'password')

    expect(mockTransaction.accountMip.updateMany).toHaveBeenCalled()
  })

  it.each([UserStatus.IMPORTED, UserStatus.PENDING_REQUEST, UserStatus.SUSPENDED])(
    'does not set a password for an account with status %s',
    async (status) => {
      mockTransaction.accountMip.findUnique.mockResolvedValue({ id: 'account-mip-id', status })

      await expect(updateUserPasswordForEmail('user@example.com', 'password')).rejects.toThrow(
        'Account with email user@example.com has a wrong status',
      )

      expect(mockTransaction.user.update).not.toHaveBeenCalled()
      expect(mockTransaction.accountMip.updateMany).not.toHaveBeenCalled()
    },
  )

  it('rejects a user without an MIP account before changing the password', async () => {
    mockTransaction.accountMip.findUnique.mockResolvedValue(null)

    await expect(updateUserPasswordForEmail('user@example.com', 'password')).rejects.toThrow(
      'Account with email user@example.com not found',
    )

    expect(mockTransaction.user.update).not.toHaveBeenCalled()
  })

  it('does not update the password if the account was suspended concurrently', async () => {
    mockTransaction.accountMip.updateMany.mockResolvedValue({ count: 0 })

    await expect(updateUserPasswordForEmail('user@example.com', 'password')).rejects.toThrow(
      'Account with email user@example.com has a wrong status',
    )

    expect(mockTransaction.user.update).not.toHaveBeenCalled()
  })
})
