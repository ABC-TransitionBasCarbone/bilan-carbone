'use client'

import React, { ReactNode } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'

interface Props {
  children: ReactNode
}

const Providers = ({ children }: Props) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      {children}
    </LocalizationProvider>
  )
}

export default Providers
