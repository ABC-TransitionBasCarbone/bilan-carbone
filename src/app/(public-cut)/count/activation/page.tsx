import ActivationForm from '@/components/auth/ActivationForm'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

const ActivationPage = async () => {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return <ActivationForm />
}

export default ActivationPage
