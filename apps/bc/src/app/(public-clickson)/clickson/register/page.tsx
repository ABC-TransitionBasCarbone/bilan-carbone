import SignUpFormClickson from '@/components/auth/SignUpFormClickson'
import { auth } from '@/services/auth.server'
import { redirect } from 'next/navigation'

const ClicksonSignUpPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <SignUpFormClickson />
}

export default ClicksonSignUpPage
