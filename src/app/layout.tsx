import RouteChangeListener from '@/components/RouteChangeListener'
import '@/css/index.css'
import { Locale } from '@/i18n/config'
import { getEnvironment } from '@/i18n/environment'
import Providers from '@/services/providers/Providers'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { Environment } from '@prisma/client'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Bilan Carbone +',
  description: 'Découvrez le logiciel Bilan Carbone +',
}

interface Props {
  children: React.ReactNode
}

const RootLayout = async ({ children }: Readonly<Props>) => {
  const environment = await getEnvironment()

  const locale = environment === Environment.CUT ? Locale.FR : await getLocale()
  environment === Environment.CUT && setRequestLocale(Locale.FR)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  const providerOptions = { key: 'mui', nonce: (await headers()).get('x-nonce') || undefined, prepend: true }
  return (
    <html lang={locale} className={environment}>
      <body>
        <AppRouterCacheProvider options={providerOptions}>
          <NextIntlClientProvider messages={messages}>
            <RouteChangeListener />
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

export default RootLayout
