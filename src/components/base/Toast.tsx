import { SEC, TIME_IN_MS } from '@/utils/time'
import { Snackbar, SnackbarOrigin } from '@mui/material'
import Alert from '@mui/material/Alert'

export type ToastColors = 'success' | 'error' | 'info' | 'warning'

interface Props {
  position: SnackbarOrigin
  open: boolean
  onClose: () => void
  message: string
  color: 'success' | 'error' | 'info' | 'warning'
  toastKey: string
  duration?: number
}

const backgrounds: Record<ToastColors, string> = {
  info: 'var(--neutral-400)',
  error: 'var(--error-50)',
  success: 'var(--success-100)',
  warning: 'var(--warning)',
}

const Toast = ({ position, open, onClose, message, color, toastKey, duration }: Props) => (
  <Snackbar
    key={toastKey}
    anchorOrigin={position}
    open={open}
    onClose={onClose}
    autoHideDuration={duration || 5 * SEC * TIME_IN_MS}
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
