import { prismaClient } from '@/db/client.server'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { hashResetToken } from '@abc-transitionbascarbone/common/utils/user.server'
import { expect } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { checkToken, reset } from './auth'

jest.mock('@/db/user', () => ({
  getUserByEmailWithSensibleInformations: jest.fn(),
}))

jest.mock('@/db/client.server', () => ({
  prismaClient: {
    user: { update: jest.fn() },
    account: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    userCheckedStep: { upsert: jest.fn() },
  },
}))

jest.mock('@/utils/serverResponse', () => ({
  withServerResponse: jest.fn(async (_name, fn) => {
    try {
      const data = await fn()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }),
}))

const mockGetUserByEmailWithSensibleInformations = getUserByEmailWithSensibleInformations as jest.Mock
const mockUserUpdate = prismaClient.user.update as jest.Mock
const mockAccountFindFirst = prismaClient.account.findFirst as jest.Mock
const mockAccountFindMany = prismaClient.account.findMany as jest.Mock
const mockAccountUpdate = prismaClient.account.update as jest.Mock
const mockUserCheckedStepUpsert = prismaClient.userCheckedStep.upsert as jest.Mock

const email = 'user@example.com'
const resetToken = 'reset-token'
const password = 'Password-1'

const getToken = (payloadResetToken = resetToken) =>
  jwt.sign({ email, resetToken: payloadResetToken }, process.env.NEXTAUTH_SECRET as string)

describe('password reset server functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXTAUTH_SECRET = 'test-secret'
    mockGetUserByEmailWithSensibleInformations.mockResolvedValue({ email, resetToken: hashResetToken(resetToken) })
    mockUserUpdate.mockResolvedValue({ id: 'user-id', email })
    mockAccountFindFirst.mockResolvedValue({ id: 'account-id' })
    mockAccountFindMany.mockResolvedValue([
      { id: 'account-id', environment: Environment.TILT },
      { id: 'bc-account-id', environment: Environment.BC },
    ])
    mockAccountUpdate.mockResolvedValue({})
    mockUserCheckedStepUpsert.mockResolvedValue({})
  })

  it('accepts a reset link only when the token reset value still matches the user', async () => {
    await expect(checkToken(getToken())).resolves.toBe(false)
    expect(mockGetUserByEmailWithSensibleInformations).toHaveBeenCalledWith(email)
  })

  it('rejects a reset link when another reset token is stored for the user', async () => {
    mockGetUserByEmailWithSensibleInformations.mockResolvedValue({ email, resetToken: hashResetToken('new-token') })

    await expect(checkToken(getToken())).resolves.toBe(true)
  })

  it('updates the password for the user identified by the reset token without requiring an email input', async () => {
    const result = await reset(password, getToken(), Environment.TILT)

    expect(result).toEqual({ success: true, data: true })
    expect(mockGetUserByEmailWithSensibleInformations).toHaveBeenCalledWith(email)
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { email },
      data: { resetToken: null, password: expect.any(String) },
    })
    expect(mockAccountFindFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ userId: 'user-id', environment: Environment.TILT }),
    })
    expect(mockAccountUpdate).toHaveBeenCalledWith({
      where: { userId_environment: { userId: 'user-id', environment: Environment.TILT } },
      data: { activationRequestedAt: null, status: 'ACTIVE' },
    })
    expect(mockUserCheckedStepUpsert).toHaveBeenCalledWith({
      where: { accountId_step: { accountId: 'bc-account-id', step: 'CreateAccount' } },
      update: {},
      create: { accountId: 'bc-account-id', step: 'CreateAccount' },
    })
  })

  it('does not update the password when the stored reset token does not match the link token', async () => {
    mockGetUserByEmailWithSensibleInformations.mockResolvedValue({ email, resetToken: hashResetToken('new-token') })

    const result = await reset(password, getToken(), Environment.TILT)

    expect(result).toEqual({ success: false, errorMessage: 'Email or token is invalid' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })
})
