import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { expect } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { getUserByEmailWithSensibleInformations, updateUserPasswordForEmail } from '@/db/user'
import { checkToken, reset } from './auth'

jest.mock('@/db/user', () => ({
  getUserByEmailWithSensibleInformations: jest.fn(),
  updateUserPasswordForEmail: jest.fn(),
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
const mockUpdateUserPasswordForEmail = updateUserPasswordForEmail as jest.Mock

const email = 'user@example.com'
const resetToken = 'reset-token'
const password = 'Password-1'

const getToken = (payloadResetToken = resetToken) =>
  jwt.sign({ email, resetToken: payloadResetToken }, process.env.NEXTAUTH_SECRET as string)

describe('password reset server functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXTAUTH_SECRET = 'test-secret'
    mockGetUserByEmailWithSensibleInformations.mockResolvedValue({ email, resetToken })
    mockUpdateUserPasswordForEmail.mockResolvedValue({ email })
  })

  it('accepts a reset link only when the token reset value still matches the user', async () => {
    await expect(checkToken(getToken())).resolves.toBe(false)
    expect(mockGetUserByEmailWithSensibleInformations).toHaveBeenCalledWith(email)
  })

  it('rejects a reset link when another reset token is stored for the user', async () => {
    mockGetUserByEmailWithSensibleInformations.mockResolvedValue({ email, resetToken: 'new-token' })

    await expect(checkToken(getToken())).resolves.toBe(true)
  })

  it('updates the password for the user identified by the reset token without requiring an email input', async () => {
    const result = await reset(password, getToken(), Environment.TILT)

    expect(result).toEqual({ success: true, data: true })
    expect(mockGetUserByEmailWithSensibleInformations).toHaveBeenCalledWith(email)
    expect(mockUpdateUserPasswordForEmail).toHaveBeenCalledWith(email, password, Environment.TILT)
  })

  it('does not update the password when the stored reset token does not match the link token', async () => {
    mockGetUserByEmailWithSensibleInformations.mockResolvedValue({ email, resetToken: 'new-token' })

    const result = await reset(password, getToken(), Environment.TILT)

    expect(result).toEqual({ success: false, errorMessage: 'Email or token is invalid' })
    expect(mockUpdateUserPasswordForEmail).not.toHaveBeenCalled()
  })
})
