'use client'

import { LocaleType } from '@/i18n/config'
import { configureZod } from '@/lib/zod.config'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect } from 'react'

export function ZodConfigClientProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const t = useTranslations('validation')

  useEffect(() => {
    configureZod(locale as LocaleType, t)
  }, [locale, t])

  return <>{children}</>
}
