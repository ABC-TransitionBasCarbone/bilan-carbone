import { SEC, TIME_IN_MS } from '@/utils/time'
import { Snackbar, SnackbarOrigin } from '@mui/material'
import Alert from '@mui/material/Alert'

export type ToastColors = 'success' | 'error' | 'info' | 'warning'

interface Props {
  position: SnackbarOrigin
  open: boolean
  onClose: () => void
  message: string
  color: ToastColors
  toastKey: string
  duration?: number
  slotProps?: {
    transition?: { onExited?: () => void }
  }
}

const backgrounds: Record<ToastColors, string> = {
  info: 'var(--neutral-400)',
  error: 'var(--error-50)',
  success: 'var(--success-100)',
  warning: 'var(--warning)',
}

const Toast = ({ position, open, onClose, message, color, toastKey, duration, slotProps }: Props) => (
  <Snackbar
    key={toastKey}
    anchorOrigin={position}
    open={open}
    onClose={onClose}
    autoHideDuration={duration || 5 * SEC * TIME_IN_MS}
    slotProps={slotProps}
  >
    <Alert
      onClose={onClose}
      icon={<></>}
      data-testid="alert-toaster"
      sx={{ background: backgrounds[color], color: 'white' }}
    >
      {message}
    </Alert>
  </Snackbar>
)

export default Toast
