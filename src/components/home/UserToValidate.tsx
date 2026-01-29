import { customRich } from '@/i18n/customRich'
import { Alert } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const UserToValidate = () => {
  const t = useTranslations('home')
  return (
    <Alert severity="info">
      {customRich(t,'userToValidate', {
        link: (children) => <Link href="/equipe">{children}</Link>,
      })}
    </Alert>
  )
}

export default UserToValidate
