'use client'

import { ToastProvider } from '@/components/base/ToastProvider'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const Providers = ({ children }: Props) => {
  return (
    <ToastProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        {children}
      </LocalizationProvider>
    </ToastProvider>
  )
}

export default Providers
