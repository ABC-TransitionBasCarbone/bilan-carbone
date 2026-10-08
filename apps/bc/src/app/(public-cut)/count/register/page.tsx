import SignUpFormCut from '@/components/auth/SignUpFormCut'
import { auth } from '@/services/auth.server'
import { redirect } from 'next/navigation'

const CountSignUpPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <SignUpFormCut />
}

export default CountSignUpPage
