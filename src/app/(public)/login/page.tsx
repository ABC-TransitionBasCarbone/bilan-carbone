import LoginForm from '@/components/auth/LoginForm'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

const LoginPage = async () => {
  const session = await auth()
  if (session) {
    if (session.user.needsAccountSelection) {
      redirect('/selection-du-compte')
    } else {
      redirect('/')
    }
  }

  return <LoginForm />
}

export default LoginPage
