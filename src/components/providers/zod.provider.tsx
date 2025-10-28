// components/providers/zod-config-provider.tsx
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
    // Preventing hydration error by not re-running the function on every render but only when locale changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  return <>{children}</>
}
