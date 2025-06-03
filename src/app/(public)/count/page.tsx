import SignUpFormCut from '@/components/auth/SignUpFormCut'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

const CountLoginPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <SignUpFormCut />
}

export default CountLoginPage
