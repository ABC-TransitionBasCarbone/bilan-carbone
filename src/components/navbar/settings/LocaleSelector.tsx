'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import Dropdown from '@/components/dropdown'
import { DropdownOption, SelectedOption } from '@/components/dropdown'
import { getLocale, switchLocale } from '@/i18n/request'
import { EN, FR, LocaleType, defaultLocale } from '@/i18n/config'

const LocaleSelector = ({ isOpen }: Props) => {
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

  const localeOptions: DropdownOption[] = [
    { value: EN, label: t('en') },
    { value: FR, label: t('fr') },
  ]

  return (
    <Dropdown
      className={styles['locale-selector']}
      options={localeOptions}
      selectedOption={locale || defaultLocale}
      onChange={changeLocale}
      width={isOpen ? 8 : 4}
    />
  )
}

interface Props {
  isOpen?: boolean
}

export default LocaleSelector
