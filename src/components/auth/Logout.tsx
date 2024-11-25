'use client'

import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Button from '../base/Button'

// Not accessible from the site, but usefull for E2E tests
const Logout = () => {
  const t = useTranslations('profile')

  return (
    <Button href="#" onClick={() => signOut()}>
      {t('logout')}
    </Button>
  )
}

export default Logout
