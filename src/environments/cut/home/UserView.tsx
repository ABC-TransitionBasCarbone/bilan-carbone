'use client'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Box, BoxProps, LinkProps, Link as MUILink, styled, Typography, useTheme } from '@mui/material'

import { grey } from '@mui/material/colors'
import classNames from 'classnames'
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
      sx={{
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
      }}
    />
  )
}

const UserView = () => {
  return (
    <Box component="section" className={styles.container}>
      <Typography variant="h4">Faire votre bilan d’impact vous permettra de :</Typography>
      <StyledBox className={classNames(styles.styledBoxContainer, styles.styledBoxInfo)}>
        <CheckCircleOutlineIcon sx={{ color: grey[300] }} fontSize="large" />
        <Typography>Comprendre la mesure d’impact de votre établissement</Typography>
      </StyledBox>
      <StyledBox className={classNames(styles.styledBoxContainer, styles.styledBoxInfo)}>
        <CheckCircleOutlineIcon sx={{ color: grey[500] }} fontSize="large" className={styles.checkIcon} />
        <Typography>Indentifier les priorités d’action</Typography>
      </StyledBox>
      <StyledBox className={classNames(styles.styledBoxContainer, styles.styledBoxInfo)}>
        <CheckCircleOutlineIcon sx={{ color: grey[500] }} fontSize="large" className={styles.checkIcon} />
        <Typography>Construire une trajectoire de réduction</Typography>
      </StyledBox>
      <Box className={styles.linkContainer}>
        <StyledLink color="info" href="/equipe" className={classNames(styles.styledBoxContainer, styles.styledBoxLink)}>
          <CinemaOutlinedIcon className={styles.icon} />
          <Typography>Mes cinémas</Typography>
        </StyledLink>
        <StyledLink
          color="info"
          href="/organisations"
          className={classNames(styles.styledBoxContainer, styles.styledBoxLink)}
        >
          <DiagramOutlinedIcon className={styles.icon} />
          <Typography>Mes bilans</Typography>
        </StyledLink>
      </Box>
    </Box>
  )
}

export default UserView
