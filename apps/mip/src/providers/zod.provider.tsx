'use client'

import { LocaleType } from '@/i18n/config'
import { configureZod } from '@/lib/zod.config'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect } from 'react'

export function ZodConfigClientProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = useLocale()

  useEffect(() => {
    configureZod(locale as LocaleType)
  }, [locale])

  return <>{children}</>
}
