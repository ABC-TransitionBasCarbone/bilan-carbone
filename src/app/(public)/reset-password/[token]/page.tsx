import jwt from 'jsonwebtoken'
import { getUserByEmail, updateUserPasswordForEmail } from '@/db/user'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import React from 'react'
import ResetForm from '@/components/auth/resetForm'

const ResetPasswordPage = async ({ params: { token } }: { params: { token: string } }) => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  const reset = async (email: string, password: string) => {
    'use server'
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

  return <ResetForm reset={reset} />
}

export default ResetPasswordPage
