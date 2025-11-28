import { CheckCircle, Error } from '@mui/icons-material'
import { Box, CircularProgress, Fade, styled, Typography, useTheme } from '@mui/material'
import { FieldSaveStatus } from '../../hooks/useAutoSave'

interface SaveStatusIndicatorProps {
  status: FieldSaveStatus
  variant?: 'compact' | 'full' | 'fixed' // 'fixed' = position fixe en haut à droite
  showTime?: boolean
}

const SaveStatusIndicator = ({ status, variant = 'fixed', showTime = true }: SaveStatusIndicatorProps) => {
  const theme = useTheme()

  const getStatusContent = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <CircularProgress size={20} />,
          color: theme.palette.text.secondary,
          text: 'Sauvegarde...',
          bgColor: theme.palette.grey[100],
        }
      case 'saved':
        return {
          icon: <CheckCircle fontSize="small" />,
          color: theme.palette.success.main,
          text: 'Sauvegardé',
          bgColor: theme.palette.success.light + '20',
        }
      case 'error':
        return {
          icon: <Error fontSize="small" />,
          color: theme.palette.error.main,
          text: 'Erreur',
          bgColor: theme.palette.error.light + '20',
        }
      case 'idle':
      default:
        return null
    }
  }

  const statusContent = getStatusContent()

  const formatTime = (date?: Date) => {
    if (!date) return ''
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  // Variante fixe (position fixe en haut à droite, toujours visible)
  if (variant === 'fixed') {
    return (
      <FixedContainer>
        <Fade in={!!statusContent} timeout={300}>
          <FixedContent
            sx={{
              backgroundColor: statusContent?.bgColor || 'transparent',
              border: statusContent ? `1px solid ${statusContent.color}30` : 'none',
              opacity: statusContent ? 1 : 0,
              visibility: statusContent ? 'visible' : 'hidden',
            }}
          >
            {statusContent?.icon && <StyledIcon statusColor={statusContent.color}>{statusContent.icon}</StyledIcon>}
            {statusContent?.text && (
              <Box>
                <StatusText sx={{ color: statusContent.color }}>{statusContent.text}</StatusText>
                {showTime && status.status === 'saved' && status.lastSaved && (
                  <TimeText>à {formatTime(status.lastSaved)}</TimeText>
                )}
                {status.status === 'error' && status.error && (
                  <TimeText sx={{ color: theme.palette.error.main }}>{status.error}</TimeText>
                )}
              </Box>
            )}
          </FixedContent>
        </Fade>
      </FixedContainer>
    )
  }

  // Variante compacte (icône seule)
  if (variant === 'compact') {
    if (!statusContent) return null
    return (
      <Fade in timeout={300}>
        <StyledIcon statusColor={statusContent.color} title={statusContent.text}>
          {statusContent.icon}
        </StyledIcon>
      </Fade>
    )
  }

  // Variante full (intégré dans le flow)
  if (!statusContent) return null
  return (
    <Fade in timeout={1000}>
      <Container
        sx={{
          backgroundColor: statusContent.bgColor,
          border: `1px solid ${statusContent.color}30`,
        }}
      >
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
    </Fade>
  )
}

// Container pour la variante fixe
const FixedContainer = styled(Box)(() => ({
  position: 'fixed',
  bottom: '1rem',
  right: '1rem',
  zIndex: 1200,
  pointerEvents: 'none', // Ne bloque pas les clics
}))

const FixedContent = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  pointerEvents: 'auto', // Le contenu peut recevoir des clics
  minWidth: '150px', // Largeur minimale pour éviter le rétrécissement
  minHeight: '40px', // Hauteur minimale pour éviter le saut
}))

// Container pour variante full
const Container = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  transition: 'all 0.3s ease',
  marginTop: '0.5rem',
  marginBottom: '0.5rem',
}))

const StyledIcon = styled(Box)<{ statusColor: string }>(({ statusColor }) => ({
  fontSize: '1.25rem',
  color: statusColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px', // Espace réservé
}))

const StatusText = styled(Typography)(() => ({
  fontSize: '0.875rem',
  fontWeight: 500,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
}))

const TimeText = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
}))

export default SaveStatusIndicator
