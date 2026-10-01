'use client'

import { configureZod } from '@abc-transitionbascarbone/application/lib'
import { LocaleType } from '@abc-transitionbascarbone/shared/i18n/config'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'

export function ZodConfigClientProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale()

  useEffect(() => {
    configureZod(locale as LocaleType)
  }, [locale])

  return <>{children}</>
}
