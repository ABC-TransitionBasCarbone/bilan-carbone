'use client'

import { SEC, TIME_IN_MS } from '@/utils/time'
import { Box } from '@mui/material'
import Alert from '@mui/material/Alert'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface ToastData {
  id: string
  message: string
  type: 'success' | 'error'
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

const backgrounds = {
  error: 'var(--error-50)',
  success: 'var(--success-100)',
}

interface StackableToastProps {
  message: string
  color: 'success' | 'error'
  duration?: number
  onClose: () => void
}

const StackableToast = ({ message, color, duration, onClose }: StackableToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration || 5 * SEC * TIME_IN_MS)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <Alert
      onClose={onClose}
      icon={<></>}
      data-testid="alert-toaster"
      sx={{ background: backgrounds[color], color: 'white' }}
    >
      {message}
    </Alert>
  )
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showErrorToast = (message: string, duration?: number) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const newToast: ToastData = { id, message, type: 'error', duration }

    setToasts((prev) => [...prev, newToast])
  }

  const showSuccessToast = (message: string, duration?: number) => {
    const id = `success-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    const newToast: ToastData = { id, message, type: 'success', duration }

    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showErrorToast, showSuccessToast }}>
      {children}
      {toasts.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: '1rem',
            left: '1rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column-reverse',
            gap: '0.5rem',
          }}
        >
          {toasts.map((toast) => (
            <StackableToast
              key={toast.id}
              onClose={() => removeToast(toast.id)}
              message={toast.message}
              color={toast.type}
              duration={toast.duration}
            />
          ))}
        </Box>
      )}
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
