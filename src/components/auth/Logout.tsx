'use client'

import React from 'react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Button from '../base/Button'

const Logout = () => {
  const t = useTranslations('profile')

  return (
    <Button href="#" onClick={() => signOut()}>
      {t('logout')}
    </Button>
  )
}

export default Logout
