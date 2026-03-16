import SignUpFormTilt from '@/components/auth/SignUpFormTilt'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

const TiltSignUpPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <SignUpFormTilt />
}

export default TiltSignUpPage
