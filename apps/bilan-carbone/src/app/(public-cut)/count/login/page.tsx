import LoginForm from '@/components/auth/LoginForm'
import { auth } from '@/services/auth'
import { Environment } from '@repo/db-common/enums'
import { redirect } from 'next/navigation'

const LoginPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <LoginForm environment={Environment.CUT} />
}

export default LoginPage
