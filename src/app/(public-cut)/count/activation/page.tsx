import ActivationForm from '@/components/auth/ActivationForm'
import { auth } from '@/services/auth'
import { Environment } from '@prisma/client'
import { redirect } from 'next/navigation'

const ActivationPage = async () => {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return <ActivationForm environment={Environment.CUT} />
}

export default ActivationPage
