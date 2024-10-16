'use client'

import { ComponentProps, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import styles from './Settings.module.css'
import Dropdown from '@/components/base/Dropdown'
import { SelectedOption } from '@/components/base/Dropdown'
import { getLocale, switchLocale } from '@/i18n/request'
import { Locale, LocaleType, defaultLocale } from '@/i18n/config'

const LocaleSelector = () => {
  const t = useTranslations('locale')
  const [locale, setLocale] = useState<LocaleType>(defaultLocale)

  useEffect(() => {
    getLocale().then((value) => {
      setLocale(value)
    })
  }, [])

  const changeLocale = (value: SelectedOption) => {
    switchLocale(value as LocaleType)
    setLocale(value as LocaleType)
  }

  const localeOptions: ComponentProps<'option'>[] = Object.values(Locale).map((value) => ({
    value,
    label: t(value),
  }))

  return (
    <Dropdown
      id="locale-selector"
      className={styles.localeSelector}
      options={localeOptions}
      selectedOption={locale}
      onChangeValue={changeLocale}
      label={t('selector')}
      data-testid="locale-selector"
      hiddenLabel
    />
  )
}

export default LocaleSelector
