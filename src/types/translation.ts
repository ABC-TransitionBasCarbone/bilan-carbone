import { useTranslations } from 'next-intl'

export type Translations = ReturnType<typeof useTranslations>
export type localeType = 'fr' | 'en'
