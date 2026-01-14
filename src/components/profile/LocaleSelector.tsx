'use client'

import { Locale, LocaleType, defaultLocale } from '@/i18n/config'
import { getLocale, switchLocale } from '@/i18n/locale'
import { hasAccessToAllLocales } from '@/services/permissions/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { InputLabel, MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

const LocaleSelector = () => {
  const t = useTranslations('locale')
  const [locale, setLocale] = useState<LocaleType>(defaultLocale)

  const { environment } = useAppEnvironmentStore()

  const availableLocales = useMemo(() => {
    if (environment && hasAccessToAllLocales(environment)) {
      return Object.keys(Locale)
    }
    return [Locale.EN, Locale.FR]
  }, [environment])

  useEffect(() => {
    getLocale().then((value) => {
      setLocale(value)
    })
  }, [])

  return (
    <>
      <InputLabel id="local-selector-label">{t('selector')}</InputLabel>
      <Select
        value={locale}
        aria-labelledby="local-selector-label"
        onChange={(event) => {
          switchLocale(event.target.value as LocaleType)
          setLocale(event.target.value as LocaleType)
        }}
      >
        {availableLocales
          .map((local) => local.toLowerCase())
          .map((local) => (
            <MenuItem key={local} value={local}>
              {t(local)}
            </MenuItem>
          ))}
      </Select>
    </>
  )
}

export default LocaleSelector
