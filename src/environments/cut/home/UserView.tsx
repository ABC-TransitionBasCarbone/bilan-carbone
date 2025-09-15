'use client'
import { Alert, Box, BoxProps, LinkProps, Link as MUILink, styled, Typography, useTheme } from '@mui/material'

import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import DiagramOutlinedIcon from '../icons/DiagramOutlinedIcon'

import Block from '@/components/base/Block'
import { UserSession } from 'next-auth'
import CinemaOutlinedIcon from '../icons/CinemaOutlinedIcon'
import styles from './UserView.module.css'

interface Props {
  account: UserSession
}

const infoLength = 3

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  borderColor: theme.palette.primary.main,
  backgroundColor: theme.palette.secondary.light,
  color: theme.palette.text.primary,
}))

const StyledLink = ({ ...props }: LinkProps) => {
  const theme = useTheme()
  return (
    <MUILink
      component={Link}
      {...props}
      borderColor={theme.palette.primary.main}
      backgroundColor={theme.palette.primary.light}
      color={theme.palette.text.primary}
      padding="1rem"
    />
  )
}

const UserView = ({ account }: Props) => {
  const t = useTranslations('home')
  const title = t('title')
  const navigation = useTranslations('home.navigation')

  return (
    <div className={styles.block}>
      <Block>
        <Box component="section" className={classNames('flex-col', styles.container)}>
          <StyledBox
            className={classNames('flex', styles.styledBoxContainer, styles.styledBoxInfo, styles.mainInfoBox)}
          >
            <Box className={classNames('flex-col', styles.leftContent)}>
              <Typography data-testid="title" variant="h4" className={styles.titleInBox}>
                {title}
              </Typography>
              {Array.from({ length: infoLength }, (_, i) => (
                <Box key={i} className={classNames('flex align-center', styles.bulletPoint)}>
                  <Typography>{i + 1}.</Typography>
                  <Typography>{t(`info.${i}`)}</Typography>
                </Box>
              ))}
            </Box>
            <Box className="flex align-center">
              <Link href="/organisations" className={styles.startButtonLink}>
                <Box className={classNames('flex align-center justify-center', styles.startButton)} component="button">
                  <Typography variant="h6" className={styles.startButtonText}>
                    DÉMARRER
                  </Typography>
                </Box>
              </Link>
            </Box>
          </StyledBox>
          <Box className={classNames('flex', styles.linkContainer)}>
            <StyledLink
              color="info"
              href={`/organisations/${account.organizationVersionId}/modifier`}
              className={classNames(
                'flex-col justify-center align-center',
                styles.styledBoxContainer,
                styles.styledBoxLink,
              )}
            >
              <CinemaOutlinedIcon className={styles.icon} />
              <Box>
                <Typography>{navigation('movietheater.title')}</Typography>
                <Typography variant="subtitle2" className={styles.linkMessage}>
                  {navigation('movietheater.message')}
                </Typography>
              </Box>
            </StyledLink>
            <StyledLink
              color="info"
              href="/equipe"
              className={classNames(
                'flex-col justify-center align-center',
                styles.styledBoxContainer,
                styles.styledBoxLink,
              )}
            >
              <Groups2OutlinedIcon className={styles.icon} />
              <Box>
                <Typography>{navigation('collaborators.title')}</Typography>
                <Typography variant="subtitle2" className={styles.linkMessage}>
                  {navigation('collaborators.message')}
                </Typography>
              </Box>
            </StyledLink>
            <StyledLink
              color="info"
              href="/organisations"
              className={classNames(
                'flex-col justify-center align-center',
                styles.styledBoxContainer,
                styles.styledBoxLink,
              )}
            >
              <DiagramOutlinedIcon className={styles.icon} />
              <Box>
                <Typography>{navigation('footprints.title')}</Typography>
                <Typography variant="subtitle2" className={styles.linkMessage}>
                  {navigation('footprints.message')}
                </Typography>
              </Box>
            </StyledLink>
          </Box>
          <Alert severity="info" className="mb-2">
            {t.rich('alert.info', {
              link: (chunks) => (
                <Link
                  href="https://www.guide-communication-climat.fr/definitions/approches-de-comptabilite-carbone"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </Link>
              ),
            })}
          </Alert>
        </Box>
      </Block>
    </div>
  )
}

export default UserView
