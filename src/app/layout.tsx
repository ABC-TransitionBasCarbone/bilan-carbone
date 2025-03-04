import '@/css/index.css'
import Providers from '@/services/providers/Providers'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import Head from 'next/head'

const theme = process.env.NEXT_PUBLIC_THEME || 'base'

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
    <html lang={locale} className={theme}>
      <Head>
        <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/gilroy-bold" />
      </Head>
      <body>
        <AppRouterCacheProvider>
          <NextIntlClientProvider messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

export default RootLayout
