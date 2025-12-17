'use client'

import { ToastProvider } from '@/components/base/ToastProvider'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const Providers = ({ children }: Props) => {
  return (
    <ToastProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        <SessionProvider>{children}</SessionProvider>
      </LocalizationProvider>
    </ToastProvider>
  )
}

export default Providers
