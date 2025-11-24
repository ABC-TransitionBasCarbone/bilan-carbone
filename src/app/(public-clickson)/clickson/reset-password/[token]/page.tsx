import ResetForm from '@/components/auth/ResetForm'
import { auth } from '@/services/auth'
import { Environment } from '@prisma/client'

interface Props {
  params: Promise<{ token: string }>
}

const ResetPasswordPage = async (props: Props) => {
  const params = await props.params

  const { token } = params

  const session = await auth()

  return <ResetForm user={session?.user} token={token} environment={Environment.CLICKSON} />
}

export default ResetPasswordPage
