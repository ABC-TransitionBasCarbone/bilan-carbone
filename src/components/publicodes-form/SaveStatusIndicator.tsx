import { CheckCircle, Error } from '@mui/icons-material'
import { Box, CircularProgress, styled, Typography, useTheme } from '@mui/material'

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

  const getStatusContent = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <CircularProgress size={16} />,
          color: theme.palette.text.secondary,
          text: 'Sauvegarde en cours...',
        }
      case 'saved':
        return {
          icon: <CheckCircle fontSize="small" />,
          color: theme.palette.success.dark,
          text: 'Sauvegardé',
        }
      case 'error':
        return {
          icon: <Error fontSize="small" />,
          color: theme.palette.error.main,
          text: 'Erreur de sauvegarde',
        }
      case 'idle':
      default:
        return {
          icon: <CheckCircle fontSize="small" />,
          color: theme.palette.grey[400],
          text: 'Prêt',
        }
    }
  }

  const statusContent = getStatusContent()

  const formatTime = (date?: Date) => {
    if (!date) return ''
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <Container>
      <StyledIcon statusColor={statusContent.color}>{statusContent.icon}</StyledIcon>
      <Box>
        <StatusText sx={{ color: statusContent.color }}>{statusContent.text}</StatusText>
        {showTime && status.status === 'saved' && status.lastSaved && (
          <TimeText>à {formatTime(status.lastSaved)}</TimeText>
        )}
        {status.status === 'error' && status.error && (
          <TimeText sx={{ color: theme.palette.error.main }}>{status.error}</TimeText>
        )}
      </Box>
    </Container>
  )
}

const Container = styled(Box)(({ theme }) => ({
  width: 'fit-content',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.625rem 1rem',
  borderRadius: '0.5rem',
  marginBottom: '1rem',
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
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
