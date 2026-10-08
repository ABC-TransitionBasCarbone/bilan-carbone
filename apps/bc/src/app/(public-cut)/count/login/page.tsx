import LoginForm from '@/components/auth/LoginForm'
import { auth } from '@/services/auth.server'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { redirect } from 'next/navigation'

const LoginPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <LoginForm environment={Environment.CUT} />
}

export default LoginPage
