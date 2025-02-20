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
  info: 'var(--neutral-30)',
  error: 'var(--error-700)',
  success: 'var(--green-200)',
  warning: 'var(--orange-200)',
}

const Toast = ({ position, open, onClose, message, color, toastKey, duration }: Props) => (
  <Snackbar key={toastKey} anchorOrigin={position} open={open} onClose={onClose} autoHideDuration={duration || 5000}>
    <Alert onClose={onClose} icon={<></>} sx={{ background: backgrounds[color], color: 'white' }}>
      {message}
    </Alert>
  </Snackbar>
)

export default Toast
