import { generateResetToken, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import { updateUserResetTokenForEmail } from '@abc-transitionbascarbone/db-common/db'
import jwt from 'jsonwebtoken'

export const updateUserResetToken = async (email: string, duration: number) => {
  const resetToken = generateResetToken()
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / TIME_IN_MS) + duration,
  }
  await updateUserResetTokenForEmail(email, resetToken)
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
}
