import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import '../css/variables.css'
import '../css/reset.css'
import '../css/globals.css'

export const metadata: Metadata = {
  title: 'Bilan Carbone +',
  description: 'Découvrez le logiciel Bilan Carbone +',
}

const RootLayout = async ({ children }: Readonly<Props>) => {
  const locale = await getLocale()

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <AppRouterCacheProvider>
          <NextIntlClientProvider messages={messages}>
            <main>{children}</main>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

interface Props {
  children: React.ReactNode
}

export default RootLayout
