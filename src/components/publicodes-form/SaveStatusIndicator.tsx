import { CheckCircle, Error } from '@mui/icons-material'
import { Box, CircularProgress, styled, Typography, useTheme } from '@mui/material'
import { useTranslations } from 'next-intl'

export interface SaveStatusIndicatorStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  error?: string
  lastSaved?: Date
}

interface SaveStatusIndicatorProps {
  status: SaveStatusIndicatorStatus
  showTime?: boolean
}

const SaveStatusIndicator = ({ status, showTime = true }: SaveStatusIndicatorProps) => {
  const theme = useTheme()
  const t = useTranslations('saveStatus')

  const getStatusContent = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <CircularProgress size={16} />,
          color: theme.palette.text.secondary,
          text: t('saving'),
        }
      case 'saved':
        return {
          icon: <CheckCircle fontSize="small" />,
          color: theme.palette.success.dark,
          text: t('saved'),
        }
      case 'error':
        return {
          icon: <Error fontSize="small" />,
          color: theme.palette.error.main,
          text: t('error'),
        }
      case 'idle':
      default:
        return {
          icon: <CheckCircle fontSize="small" />,
          color: theme.palette.grey[400],
          text: t('ready'),
        }
    }
  }

  const statusContent = getStatusContent()

  const formatTime = (date?: Date) => {
    if (!date) {
      return ''
    }
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <StatusWrapper>
      {statusContent ? (
        <Container>
          <StyledIcon statusColor={statusContent.color}>{statusContent.icon}</StyledIcon>
          <Box>
            <StatusText sx={{ color: statusContent.color }}>{statusContent.text}</StatusText>
            {showTime && status.status === 'saved' && status.lastSaved && (
              <TimeText>
                {t('at')} {formatTime(status.lastSaved)}
              </TimeText>
            )}
            {status.status === 'error' && status.error && (
              <TimeText sx={{ color: theme.palette.error.main }}>{status.error}</TimeText>
            )}
          </Box>
        </Container>
      ) : null}
    </StatusWrapper>
  )
}

const StatusWrapper = styled(Box)(() => ({
  minHeight: '50px',
  marginBottom: '0.5rem',
}))

const Container = styled(Box)(() => ({
  width: 'fit-content',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  opacity: 1,
  transition: 'opacity 0.2s ease-in-out',
}))

const StyledIcon = styled(Box)<{ statusColor: string }>(({ statusColor }) => ({
  fontSize: '1.125rem',
  color: statusColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '18px',
}))

const StatusText = styled(Typography)(() => ({
  fontSize: '0.8125rem',
  fontWeight: 500,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
}))

const TimeText = styled(Typography)(({ theme }) => ({
  fontSize: '0.6875rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
}))

export default SaveStatusIndicator
