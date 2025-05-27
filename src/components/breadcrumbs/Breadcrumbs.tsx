'use client'
import { BASE, CUT, useAppEnvironmentStore } from '@/store/AppEnvironment';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Box, BoxProps, Link, Breadcrumbs as MUIBreadcrumbs, styled, Typography } from '@mui/material'
import { useMemo } from 'react';

interface Props {
  links: { label: string; link: string }[]
  current: string
}

const StyledContainer = styled(Box)<BoxProps>(({ theme }) => {
  const { environment } = useAppEnvironmentStore()
  return {
    backgroundColor: theme.palette.primary.light,
    borderRadius: '0 0 1rem 1rem',
    borderColor: environment === BASE ? theme.palette.divider : theme.palette.primary.dark,
    borderStyle: 'solid',
    borderWidth: '0.125rem',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
  }
})

const Breadcrumbs = ({ links, current }: Props) => {
  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])
  return (
    <nav role="navigation" aria-label="Breadcrumb" className="main-container">
      <StyledContainer className="flex-cc">
        <MUIBreadcrumbs separator={<KeyboardArrowRightIcon />}>
          {links.map(({ link, label }) => (
            <Link href={link} color={isCut ? 'primary.contrastText' : 'primary'}>{label}</Link>
          ))}
          <Typography>{current}</Typography>
        </MUIBreadcrumbs>
      </StyledContainer>
    </nav>
  )
}

export default Breadcrumbs
