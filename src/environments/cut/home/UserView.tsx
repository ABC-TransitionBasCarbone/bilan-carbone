'use client'
import { Alert, Box, BoxProps, LinkProps, Link as MUILink, styled, Typography, useTheme } from '@mui/material'

import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import DiagramOutlinedIcon from '../icons/DiagramOutlinedIcon'

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
}))

const StyledLink = ({ ...props }: LinkProps) => {
  const theme = useTheme()
  return (
    <MUILink
      component={Link}
      {...props}
      borderColor={theme.palette.primary.main}
      backgroundColor={theme.palette.primary.light}
      padding="1rem"
    />
  )
}

const UserView = ({ account }: Props) => {
  const t = useTranslations('home')
  const title = t('title')
  const navigation = useTranslations('home.navigation')

  return (
    <Box component="section" className={classNames(styles.container, 'flex-col')}>
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
      <Typography data-testid="title" variant="h4">
        {title}
      </Typography>
      {Array.from({ length: infoLength }, (_, i) => (
        <StyledBox key={i} className={classNames('flex align-center', styles.styledBoxContainer, styles.styledBoxInfo)}>
          <Typography>{i + 1}.</Typography>
          <Typography>{t(`info.${i}`)}</Typography>
        </StyledBox>
      ))}
      <Box className={classNames('flex', styles.linkContainer)}>
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
    </Box>
  )
}

export default UserView
