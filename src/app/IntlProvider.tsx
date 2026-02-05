'use client'
import { ZodConfigClientProvider } from '@/components/providers/zod.provider'
import RouteChangeListener from '@/components/RouteChangeListener'
import Providers from '@/services/providers/Providers'
import { CssBaseline } from '@mui/material'
import { Environment } from '@prisma/client'
import { NextIntlClientProvider } from 'next-intl'
import { ReactNode } from 'react'

export const WrapperNextIntlClientProvider = ({
  children,
  locale,
  environment,
  messages,
}: {
  children: ReactNode
  locale: string
  environment: Environment
  messages: Record<string, string>
}) => {
  return (
    <NextIntlClientProvider messages={messages} key={`${locale}-${environment}`} locale={locale}>
      <RouteChangeListener />
      <Providers>
        <CssBaseline />
        <ZodConfigClientProvider>{children}</ZodConfigClientProvider>
      </Providers>
    </NextIntlClientProvider>
  )
}
