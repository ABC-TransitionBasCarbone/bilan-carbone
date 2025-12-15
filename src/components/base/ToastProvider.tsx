'use client'

import { createContext, ReactNode, useContext, useState } from 'react'
import Toast from './Toast'

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

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showErrorToast = (message: string, duration?: number) => {
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastData = { id, message, type: 'error', duration }

    setToasts((prev) => [...prev, newToast])
  }

  const showSuccessToast = (message: string, duration?: number) => {
    const id = `success-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: ToastData = { id, message, type: 'success', duration }

    setToasts((prev) => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showErrorToast, showSuccessToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          position={{ vertical: 'bottom', horizontal: 'left' }}
          open={true}
          onClose={() => removeToast(toast.id)}
          message={toast.message}
          color={toast.type}
          toastKey={toast.id}
          duration={toast.duration}
        />
      ))}
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
