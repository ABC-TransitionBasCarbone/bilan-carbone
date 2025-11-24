import NewPasswordForm from '@/components/auth/NewPasswordForm'
import { auth } from '@/services/auth'
import { Environment } from '@prisma/client'
import { redirect } from 'next/navigation'

const NewPasswordPage = async () => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  return <NewPasswordForm environment={Environment.CLICKSON} />
}

export default NewPasswordPage
