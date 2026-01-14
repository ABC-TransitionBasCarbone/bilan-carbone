'use client'
import { defaultLocale, Locale, LocaleType } from '@/i18n/config'
import { customRich } from '@/i18n/customRich'
import { switchEnvironment } from '@/i18n/environment'
import { getLocale, switchLocale } from '@/i18n/locale'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import PublicContainer from '../base/PublicContainer'
import Image from '../document/Image'
import styles from './Public.module.css'

interface Props {
  children: ReactNode
}
const PublicClicksonPage = ({ children }: Props) => {
  const t = useTranslations('login')
  const tLocale = useTranslations('locale')
  const [locale, setLocale] = useState<LocaleType>(defaultLocale)

  useEffect(() => {
    getLocale().then(setLocale)
    switchEnvironment(Environment.CLICKSON)
  }, [])

  const languages = [
    { name: tLocale('en'), code: 'GB', target: Locale.EN },
    { name: tLocale('fr'), code: 'FR', target: Locale.FR },
    { name: tLocale('es'), code: 'ES', target: Locale.ES },
    { name: tLocale('el'), code: 'EL', target: Locale.EL },
    { name: tLocale('hr'), code: 'HR', target: Locale.HR },
    { name: tLocale('hu'), code: 'HU', target: Locale.HU },
    { name: tLocale('it'), code: 'IT', target: Locale.IT },
    { name: tLocale('ro'), code: 'RO', target: Locale.RO },
  ]

  return (
    <PublicContainer>
      <div className={classNames(styles.info, 'flex-col grow p2 text-center gapped4')}>
        <div>
          <p className="title-h4 mb1">{t('welcome')}</p>
          <p className="title-h6 bold">{t('subtext')}</p>
        </div>
        <p>{t('explanation')}</p>
        <div className="flex-cc gapped1 w100 p1">
          <Image
            src="/logos/clickson/logo_clickson.png"
            alt="logo"
            width={300}
            height={300}
            className={classNames(styles.image, 'w50')}
          />
        </div>
        <p>{customRich(t, 'question', {}, Environment.CLICKSON, { faq: styles.link, support: styles.link })}</p>
      </div>
      <div className={classNames(styles.loginForm, 'grow flex-col')}>
        <div className={classNames(styles.header, 'justify-between')}>
          <div className={classNames(styles.locales, 'flex')}>
            {languages.map((language) => (
              <button
                key={language.target}
                title={language.name}
                aria-label={language.name}
                className={classNames(styles.flag, 'flex', {
                  [styles.selected]: language.target === locale,
                })}
                onClick={() => {
                  switchLocale(language.target)
                  setLocale(language.target)
                }}
              >
                <Image alt={language.name} src={`/logos/${language.code}.svg`} width={30} height={20} />
              </button>
            ))}
          </div>
        </div>
        {children}
      </div>
    </PublicContainer>
  )
}

export default PublicClicksonPage
