import LoginForm from '@/components/auth/LoginForm'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import React from 'react'

const LoginPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <LoginForm></LoginForm>
}

export default LoginPage
