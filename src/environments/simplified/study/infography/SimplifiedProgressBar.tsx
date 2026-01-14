import { styled } from '@mui/material'

interface Props {
  value: number
}

const StyledProgressWrapper = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  borderRadius: '0.5rem',
  height: '0.8125rem',
  width: '100%',
  overflow: 'hidden',
  padding: '3px',
  border: `1px solid ${theme.palette.primary.light}`,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
}))

const StyledProgressBackground = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  borderRadius: '0.375rem',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
}))

const StyledProgressBar = styled('div')<{ value: number }>(({ theme, value }) => ({
  backgroundColor: theme.palette.primary.main,
  height: '100%',
  borderRadius: '0.25rem',
  width: `${value}%`,
  transition: 'width 1s ease',
}))

export const SimplifiedProgressBar = ({ value }: Props) => {
  return (
    <StyledProgressWrapper>
      <StyledProgressBackground>
        <StyledProgressBar value={value} />
      </StyledProgressBackground>
    </StyledProgressWrapper>
  )
}
