'use server'

import jwt from 'jsonwebtoken'
import { getUserByEmail, updateUserPasswordForEmail } from '@/db/user'
import { redirect } from 'next/navigation'

export const reset = async (email: string, password: string, token: string) => {
  const tokenValues = jwt.verify(token, process.env.NEXTAUTH_SECRET as string) as {
    email: string
    resetToken: string
  }

  if (tokenValues && tokenValues.email === email) {
    const user = await getUserByEmail(email)
    if (user && user.resetToken && user.resetToken === tokenValues.resetToken) {
      await updateUserPasswordForEmail(email, password)
    }
  }
  return redirect('/login')
}
