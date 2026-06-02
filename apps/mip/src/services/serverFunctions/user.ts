import { getUserByEmail } from '@/db/user'
import { withServerResponse } from '@/utils/serverResponse'
import { updateUserResetTokenForEmail } from '@abc-transitionbascarbone/db-common/db'
import { HOUR, TIME_IN_MS } from '@abc-transitionbascarbone/utils'
import jwt from 'jsonwebtoken'

export const resetPassword = async (email: string) =>
  withServerResponse('resetPassword', async () => {
    const user = await getUserByEmail(email)

    if (!user) {
      throw new Error(`No user found with email ${email}`)
    } else {
      if (user) {
        const resetToken = Math.random().toString(36)
        const payload = {
          email,
          resetToken,
          exp: Math.round(Date.now() / TIME_IN_MS) + HOUR, // 1 hour expiration
        }

        const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
        await updateUserResetTokenForEmail(email, resetToken)
        await sendResetPassword(email, token, env)
      }
    }
  })
