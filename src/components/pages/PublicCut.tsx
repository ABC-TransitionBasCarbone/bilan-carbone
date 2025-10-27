'use client'
import { defaultLocale, Locale, LocaleType } from '@/i18n/config'
import { switchEnvironment } from '@/i18n/environment'
import { getLocale, switchLocale } from '@/i18n/locale'
import { getEnvVar } from '@/lib/environment'
import { alpha, Box, Container, Divider, Link, styled, Typography } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import PublicContainer from '../base/PublicContainer'
import Image from '../document/Image'
import styles from './Public.module.css'

const StyledPublicCutPage = styled(Box)(({ theme }) => ({
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
const PublicCutPage = ({ children }: Props) => {
  const support = getEnvVar('SUPPORT_EMAIL', Environment.CUT)
  const faq = getEnvVar('FAQ_LINK', Environment.CUT)

  const t = useTranslations('login')
  const tLocale = useTranslations('locale')
  const [locale, setLocale] = useState<LocaleType>(defaultLocale)

  useEffect(() => {
    getLocale().then(setLocale)
    switchEnvironment(Environment.CUT)
  }, [])

  const languages = [{ name: tLocale('fr'), code: 'FR', target: Locale.FR }]

  return (
    <PublicContainer>
      <StyledPublicCutPage className={classNames('grow text-center')}>
        <Box p="0.1rem" borderBottom="1px solid" borderColor="success.light">
          <Box className="justify-around flex-col gapped1" minHeight="400px" px="1rem" py="2rem">
            <Typography className="title-h2">{t('welcome')}</Typography>
            <Image
              src="/logos/cut/logo-filled.svg"
              alt="logo"
              width={400}
              height={400}
              className={classNames(styles.image, 'w100')}
            />
            <Typography className="title-h6 bold">{t('subtext')}</Typography>
            <div className="justify-center">
              <Divider sx={{ borderColor: 'primary.contrastText' }} className={styles.divider} />
            </div>
            <Typography className={styles.explanation}>
              {t.rich('explanation', { b: (children) => <b>{children}</b> })}
            </Typography>
          </Box>
        </Box>
        <p>
          {t.rich('question', {
            link: (children) => (
              <Link href={faq} className={styles.linkCut} target="_blank" rel="noreferrer noopener">
                {children}
              </Link>
            ),
            support: (children) => (
              <Link href={`mailto:${support}`} className={styles.linkCut}>
                {children}
              </Link>
            ),
          })}
        </p>
        <Box className="justify-between" padding="1.2rem">
          <Image
            className={styles.france2030Logo}
            src="/logos/cut/france_2030.png"
            alt="logo"
            width={204}
            height={198}
          />
          <Typography textAlign="justify" width="75%" fontSize="0.8rem" display="flex" alignItems="center">
            {t('explanation2')}
          </Typography>
        </Box>
        <Box className="justify-between" padding="1rem">
          <Image className={styles.france2030Logo} src="/logos/cut/CINEO.png" alt="logo" width={80} height={78} />
          <Typography textAlign="justify" width="75%" fontSize="0.8rem" display="flex" alignItems="center">
            {t('cineo')}
          </Typography>
        </Box>
      </StyledPublicCutPage>
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

export default PublicCutPage
