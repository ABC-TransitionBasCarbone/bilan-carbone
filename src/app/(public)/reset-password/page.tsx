import NewPasswordForm from '@/components/auth/NewPasswordForm'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

const NewPasswordPage = async () => {
  const session = await auth()
  if (session) {
    if (session.user.needsAccountSelection) {
      redirect('/selection-du-compte')
    } else {
      redirect('/')
    }
  }

  return <NewPasswordForm />
}

export default NewPasswordPage
