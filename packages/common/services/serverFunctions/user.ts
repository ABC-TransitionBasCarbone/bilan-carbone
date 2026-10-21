import { updateUserResetTokenForEmail } from '@abc-transitionbascarbone/common/db/db'
import { TIME_IN_MS } from '@abc-transitionbascarbone/common/utils'
import { generateResetToken, hashResetToken } from '@abc-transitionbascarbone/common/utils/user.server'
import jwt from 'jsonwebtoken'

export const updateUserResetToken = async (email: string, duration: number) => {
  const resetToken = generateResetToken()
  const payload = {
    email,
    resetToken,
    exp: Math.round(Date.now() / TIME_IN_MS) + duration,
  }
  await updateUserResetTokenForEmail(email, hashResetToken(resetToken))
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
}
