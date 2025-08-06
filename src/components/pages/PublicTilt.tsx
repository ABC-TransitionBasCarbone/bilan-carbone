'use client'
import { defaultLocale, Locale, LocaleType } from '@/i18n/config'
import { switchEnvironment } from '@/i18n/environment'
import { getLocale, switchLocale } from '@/i18n/locale'
import { alpha, Box, Container, Divider, styled, Typography } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ReactNode, useEffect, useState } from 'react'
import PublicContainer from '../base/PublicContainer'
import Image from '../document/Image'
import styles from './Public.module.css'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL
const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const StyledPublicTiltPage = styled(Box)(({ theme }) => ({
  background: theme.palette.primary.main,
  border: '3px',
  borderRadius: '1rem 0 0 1rem',
  color: theme.palette.primary.contrastText,
  minWidth: '50%',
}))

const StyledLoginForm = styled(Container)(({ theme }) => ({
  border: `4px solid ${theme.palette.primary.main}`,
  borderLeft: '0px',
  borderRadius: '0 1rem 1rem 0',
  padding: '1.5rem',
  background: alpha(theme.palette.primary.main, 0.05),
}))

interface Props {
  children: ReactNode
}
const PublicTiltPage = ({ children }: Props) => {
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
      <StyledPublicTiltPage className={classNames('grow text-center')}>
        <Box p="1.5rem" borderBottom="1px solid" borderColor="success.light">
          <Box className="justify-around flex-col" minHeight="600px" px="2rem" py="5rem">
            <Typography className="title-h2">{t('welcome')}</Typography>
            <Typography className="title-h6 bold">{t('subtext')}</Typography>
            <div className="justify-center">
              <Divider sx={{ borderColor: 'primary.contrastText' }} className={styles.divider} />
            </div>
            <Typography className={styles.explaination}>
              {t.rich('explaination', { b: (children) => <b>{children}</b> })}
            </Typography>
          </Box>
        </Box>
        <Box className="justify-between" padding="2rem">
          <Typography textAlign="center" width="100%" fontSize="0.8rem">
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
          </Typography>
        </Box>
      </StyledPublicTiltPage>
      <StyledLoginForm className={classNames('grow flex-col')}>
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
      </StyledLoginForm>
    </PublicContainer>
  )
}

export default PublicTiltPage
