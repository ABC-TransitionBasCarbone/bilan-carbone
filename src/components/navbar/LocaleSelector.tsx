'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getLocale, switchLocale } from '@/i18n/request'
import { Locale, LocaleType, defaultLocale } from '@/i18n/config'
import { InputLabel, MenuItem, Select } from '@mui/material'

const LocaleSelector = () => {
  const t = useTranslations('locale')
  const [locale, setLocale] = useState<LocaleType>(defaultLocale)

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
        {Object.keys(Locale)
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
