import { prismaClient } from '@/db/client.server'
import { getUserByEmailWithSensibleInformations } from '@/db/user'
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
    accountMip: { findFirst: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
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
const mockAccountMipFindFirst = prismaClient.accountMip.findFirst as jest.Mock
const mockAccountMipFindMany = prismaClient.accountMip.findMany as jest.Mock
const mockAccountMipUpdateMany = prismaClient.accountMip.updateMany as jest.Mock

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
    mockAccountMipFindFirst.mockResolvedValue({ id: 'account-mip-id' })
    mockAccountMipFindMany.mockResolvedValue([{ id: 'account-mip-id' }])
    mockAccountMipUpdateMany.mockResolvedValue({ count: 1 })
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
    const result = await reset(password, getToken())

    expect(result).toEqual({ success: true, data: true })
    expect(mockGetUserByEmailWithSensibleInformations).toHaveBeenCalledWith(email)
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { email },
      data: { resetToken: null, password: expect.any(String) },
    })
    expect(mockAccountMipUpdateMany).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      data: { status: 'ACTIVE' },
    })
  })

  it('does not update the password when the stored reset token does not match the link token', async () => {
    mockGetUserByEmailWithSensibleInformations.mockResolvedValue({ email, resetToken: hashResetToken('new-token') })

    const result = await reset(password, getToken())

    expect(result).toEqual({ success: false, errorMessage: 'Email or token is invalid' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })
})
