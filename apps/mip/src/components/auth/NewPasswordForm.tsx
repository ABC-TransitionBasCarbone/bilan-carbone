'use client'

import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import NewPasswordFormCommon from '@abc-transitionbascarbone/components/src/auth/NewPasswordFormCommon'

interface Props {
  environment?: Environment
}

const NewPasswordForm = ({ environment = Environment.BC }: Props) => {
  const t = useTranslations('login.form')
  const router = useRouter()


  const resetPasswordHandler = async (email: string) => { console.log("email", email)
  }
  return (
    <NewPasswordFormCommon resetPassword={resetPasswordHandler} />
  )
}

export default NewPasswordForm
