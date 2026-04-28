'use client'

import { ToastProvider } from '@repo/ui'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  adapterLocale?: string
}

const Providers = ({ children, adapterLocale = 'fr' }: Props) => {
  return (
    <ToastProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={adapterLocale}>
        {children}
      </LocalizationProvider>
    </ToastProvider>
  )
}

export default Providers
