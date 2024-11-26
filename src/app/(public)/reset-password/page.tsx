import NewPasswordForm from '@/components/auth/NewPasswordForm'
import { getUserByEmail, updateUserResetTokenForEmail } from '@/db/user'
import { auth } from '@/services/auth'
import { sendResetPassword } from '@/services/email/email'
import jwt from 'jsonwebtoken'
import { redirect } from 'next/navigation'

const NewPasswordPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  const reset = async (email: string) => {
    'use server'
    const user = await getUserByEmail(email)
    if (user) {
      const resetToken = Math.random().toString(36)
      const payload = {
        email,
        resetToken,
        exp: Math.round(Date.now() / 1000) + 60 * 60, // 1 hour expiration
      }

      const token = jwt.sign(payload, process.env.NEXTAUTH_SECRET as string)
      await updateUserResetTokenForEmail(email, resetToken)
      await sendResetPassword(email, token)
    }
    return redirect('/login')
  }

  return <NewPasswordForm reset={reset} />
}

export default NewPasswordPage
