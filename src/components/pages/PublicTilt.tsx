'use client'
import { defaultLocale, Locale, LocaleType } from '@/i18n/config'
import { switchEnvironment } from '@/i18n/environment'
import { getLocale, switchLocale } from '@/i18n/locale'
import { getEnvVar } from '@/lib/environment'
import CloseIcon from '@mui/icons-material/Close'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import PublicContainer from '../base/PublicContainer'
import Image from '../document/Image'
import styles from './Public.module.css'

interface Props {
  children: ReactNode
}
const PublicTiltPage = ({ children }: Props) => {
  const support = getEnvVar('SUPPORT_EMAIL', Environment.TILT)
  const faq = getEnvVar('FAQ_LINK', Environment.TILT)

  const t = useTranslations('login')
  const tLocale = useTranslations('locale')
  const [locale, setLocale] = useState<LocaleType>(defaultLocale)

  useEffect(() => {
    getLocale().then(setLocale)
    switchEnvironment(Environment.TILT)
  }, [])

  const languages = [
    { name: tLocale('en'), code: 'GB', target: Locale.EN },
    { name: tLocale('fr'), code: 'FR', target: Locale.FR },
  ]

  return (
    <PublicContainer>
      <div className={classNames(styles.info, 'flex-col grow p2 text-center gapped4')}>
        <div>
          <p className="title-h4 mb1">{t('welcome')}</p>
          <p className="title-h6 bold">{t('subtext')}</p>
        </div>
        <p>{t.rich('explanation', { b: (children) => <b>{children}</b> })}</p>
        <div className="flex-cc gapped1 w100 p1">
          <Image src="/logos/abc/logo_abc.png" alt="ABC logo" fill className="w50 hauto" />
          <CloseIcon />
          <Image src="/logos/tilt/logo_tilt.svg" alt="TILT logo" fill className="w50 hauto" />
        </div>
        <p>
          {t.rich('question', {
            link: (children) => (
              <Link href={faq} className={styles.link} target="_blank" rel="noreferrer noopener">
                {children}
              </Link>
            ),
            support: (children) => (
              <Link href={`mailto:${support}`} className={styles.link}>
                {children}
              </Link>
            ),
          })}
        </p>
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
          <Image
            className={classNames(styles.welcomeLogo, 'align-end')}
            src="/logos/logo_BC_2025_noir.png"
            alt="logo"
            width={278}
            height={136}
          />
        </div>
        {children}
      </div>
    </PublicContainer>
  )
}

export default PublicTiltPage
