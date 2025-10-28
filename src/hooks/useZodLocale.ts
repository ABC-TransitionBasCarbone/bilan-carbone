'use client'

import { useLocale } from 'next-intl'
import { useEffect } from 'react'
import z from 'zod'

export function useZodLocale() {
  const locale = useLocale() as 'en' | 'fr'

  useEffect(() => {
    z.config(locale === 'en' ? z.locales.en() : z.locales.fr())
  }, [locale])
}
