import { CheckCircle, Error } from '@mui/icons-material'
import { Box, CircularProgress, styled, Tooltip, useTheme } from '@mui/material'
import { useTranslations } from 'next-intl'
import { FieldSaveStatus } from './hooks/useAutoSave'

interface SaveStatusIndicatorProps {
  status: FieldSaveStatus
}

const StyledIcon = styled(Box)(({ color }: { color: string }) => ({
  fontSize: '1.25rem',
  cursor: 'help',
  color,
}))

const SaveStatusIndicator = ({ status }: SaveStatusIndicatorProps) => {
  const tCommon = useTranslations('common')
  const theme = useTheme()

  const getStatusContent = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: <CircularProgress size="1.25rem" />,
          color: theme.palette.grey,
          tooltip: tCommon('saving') || 'Saving...',
        }
      case 'saved':
        return {
          icon: <CheckCircle />,
          color: theme.palette.primary.main,
          tooltip: status.lastSaved
            ? tCommon('savedAt', {
                time: status.lastSaved.toLocaleTimeString(),
              }) || `Saved at ${status.lastSaved.toLocaleTimeString()}`
            : tCommon('saved') || 'Saved',
        }
      case 'error':
        return {
          icon: <Error />,
          color: theme.palette.error.main,
          tooltip: status.error || tCommon('saveError') || 'Error saving',
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
    <Tooltip title={statusContent.tooltip} arrow>
      <StyledIcon className="flex-cc" color={statusContent.color.toString()}>
        {statusContent.icon}
      </StyledIcon>
    </Tooltip>
  )
}

export default SaveStatusIndicator
