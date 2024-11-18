import { auth } from '@/services/auth'
import React from 'react'
import ResetForm from '@/components/auth/ResetForm'

interface Props {
  params: Promise<{ token: string }>
}

const ResetPasswordPage = async (props: Props) => {
  const params = await props.params

  const { token } = params

  const session = await auth()

  return <ResetForm user={session?.user} token={token} />
}

export default ResetPasswordPage
