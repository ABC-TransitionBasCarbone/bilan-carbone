import RouteChangeListener from '@/components/RouteChangeListener'
import '@/css/index.css'
import EnvironmentInitializer from '@/environments/core/EnvironmentInitializer'
import Providers from '@/services/providers/Providers'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Head from 'next/head'

export const metadata: Metadata = {
  title: 'Bilan Carbone +',
  description: 'Découvrez le logiciel Bilan Carbone +',
}

interface Props {
  children: React.ReactNode
}

const RootLayout = async ({ children }: Readonly<Props>) => {
  const locale = await getLocale()

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()
  return (
    <html lang={locale}>
      <Head>
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/gilroy-bold" />
      </Head>
      <body>
        <AppRouterCacheProvider>
          <NextIntlClientProvider messages={messages}>
            <RouteChangeListener />
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
        <EnvironmentInitializer />
      </body>
    </html>
  )
}

export default RootLayout
