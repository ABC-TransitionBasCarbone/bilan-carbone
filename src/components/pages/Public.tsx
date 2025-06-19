'use client'
import { defaultLocale, Locale, LocaleType } from '@/i18n/config'
import { switchEnvironment } from '@/i18n/environment'
import { getLocale, switchLocale } from '@/i18n/locale'
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
const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL
const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const PublicPage = ({ children }: Props) => {
  const t = useTranslations('login')
  const tLocale = useTranslations('locale')
  const [locale, setLocale] = useState<LocaleType>(defaultLocale)

  useEffect(() => {
    getLocale().then(setLocale)
    switchEnvironment(Environment.BC)
  }, [])

  const languages = [
    { name: tLocale('en'), code: 'GB', target: Locale.EN },
    { name: tLocale('fr'), code: 'FR', target: Locale.FR },
  ]

  return (
    <PublicContainer>
      <div className={classNames(styles.info, 'grow p2 text-center')}>
        <p className="title-h4 mb1">{t('welcome')}</p>
        <p>{t.rich('explaination', { b: (children) => <b>{children}</b> })}</p>
        <Image
          src="/logos/monogramme_BC_noir.png"
          alt="logo"
          width={400}
          height={400}
          className={classNames(styles.image, 'w100')}
        />
        <p>
          {t.rich('question', {
            link: (children) => (
              <Link href={faq} className={styles.link} target="_blank" rel="noreferrer noopener">
                {children}
              </Link>
            ),
            support: (children) => (
              <Link href={`mailto:${contactMail}`} className={styles.link}>
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

export default PublicPage
