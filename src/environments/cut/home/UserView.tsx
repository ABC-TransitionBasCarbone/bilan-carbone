'use client'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Box, BoxProps, LinkProps, Link as MUILink, styled, Typography, useTheme } from '@mui/material'

import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import CinemaOutlinedIcon from '../icons/CinemaOutlinedIcon'
import DiagramOutlinedIcon from '../icons/DiagramOutlinedIcon'
import styles from './UserView.module.css'

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
    />
  )
}

const UserView = () => {
  const t = useTranslations('home')
  const title = t('title')
  const navigation = useTranslations('navigation')

  return (
    <Box component="section" className={classNames(styles.container, 'flex-col')}>
      <Typography data-testid="title" variant="h4">
        {title}
      </Typography>
      <StyledBox className={classNames('flex align-center', styles.styledBoxContainer, styles.styledBoxInfo)}>
        <CheckCircleOutlineIcon color="disabled" fontSize="large" className={styles.checkIcon} />
        <Typography>{t('info.0')}</Typography>
      </StyledBox>
      <StyledBox className={classNames('flex align-center', styles.styledBoxContainer, styles.styledBoxInfo)}>
        <CheckCircleOutlineIcon color="disabled" fontSize="large" className={styles.checkIcon} />
        <Typography>{t('info.1')}</Typography>
      </StyledBox>
      <StyledBox className={classNames('flex align-center', styles.styledBoxContainer, styles.styledBoxInfo)}>
        <CheckCircleOutlineIcon color="disabled" fontSize="large" className={styles.checkIcon} />
        <Typography>{t('info.2')}</Typography>
      </StyledBox>
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
          <CinemaOutlinedIcon className={styles.icon} />
          <Typography>{navigation('organization')}</Typography>
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
          <Typography>{navigation('organizations')}</Typography>
        </StyledLink>
      </Box>
    </Box>
  )
}

export default UserView
