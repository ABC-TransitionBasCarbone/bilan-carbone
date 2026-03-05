'use client'

import { SEC, TIME_IN_MS } from '@/utils/time'
import { SnackbarCloseReason } from '@mui/material'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import Toast, { ToastColors } from './Toast'

interface SnackbarMessage {
  message: string
  type: ToastColors
  key: number
  duration?: number
}

interface ToastContextType {
  showErrorToast: (message: string, duration?: number) => void
  showSuccessToast: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [snackPack, setSnackPack] = useState<readonly SnackbarMessage[]>([])
  const [open, setOpen] = useState(false)
  const [messageInfo, setMessageInfo] = useState<SnackbarMessage | undefined>(undefined)

  useEffect(() => {
    if (snackPack.length && !messageInfo) {
      // Set a new snack when we don't have an active one
      setMessageInfo({ ...snackPack[0] })
      setSnackPack((prev) => prev.slice(1))
      setOpen(true)
    } else if (snackPack.length && messageInfo && open) {
      // Close an active snack when a new one is added
      setOpen(false)
    }
  }, [snackPack, messageInfo, open])

  const addToast = (message: string, type: ToastColors, duration?: number) => {
    setSnackPack((prev) => [...prev, { message, type, key: new Date().getTime(), duration }])
  }

  const showErrorToast = (message: string, duration?: number) => {
    addToast(message, 'error', duration)
  }

  const showSuccessToast = (message: string, duration?: number) => {
    addToast(message, 'success', duration)
  }

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  const handleExited = () => {
    setMessageInfo(undefined)
  }

  return (
    <ToastContext.Provider value={{ showErrorToast, showSuccessToast }}>
      {children}
      <Toast
        position={{ vertical: 'bottom', horizontal: 'left' }}
        open={open}
        onClose={handleClose}
        message={messageInfo?.message ?? ''}
        color={messageInfo?.type ?? 'info'}
        toastKey={messageInfo?.key.toString() ?? ''}
        duration={messageInfo?.duration ?? 5 * SEC * TIME_IN_MS}
        slotProps={{ transition: { onExited: handleExited } }}
      />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
