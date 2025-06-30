import { CheckCircle, Error } from '@mui/icons-material'
import { Box, CircularProgress, styled, useTheme } from '@mui/material'
import { FieldSaveStatus } from '../../hooks/useAutoSave'

interface SaveStatusIndicatorProps {
  status: FieldSaveStatus
}

const StyledIcon = styled(Box)(({ color }: { color: string }) => ({
  fontSize: '1.25rem',
  color,
}))

const SaveStatusIndicator = ({ status }: SaveStatusIndicatorProps) => {
  const theme = useTheme()

  const getStatusContent = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <CircularProgress size="1.25rem" />,
          color: theme.palette.grey,
        }
      case 'saved':
        return {
          icon: <CheckCircle />,
          color: theme.palette.primary.main,
        }
      case 'error':
        return {
          icon: <Error />,
          color: theme.palette.error.main,
        }
      case 'idle':
      default:
        return null
    }
  }

  const statusContent = getStatusContent()

  if (!statusContent) {
    return null
  }

  return (
    <StyledIcon className="flex-cc" color={statusContent.color.toString()}>
      {statusContent.icon}
    </StyledIcon>
  )
}

export default SaveStatusIndicator
