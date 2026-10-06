'use client'

import { configureZod } from '@abc-transitionbascarbone/common'
import { LocaleType } from '@abc-transitionbascarbone/common/i18n/config'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'

export function ZodConfigClientProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale()

  useEffect(() => {
    configureZod(locale as LocaleType)
  }, [locale])

  return <>{children}</>
}
