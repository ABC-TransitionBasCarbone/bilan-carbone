import '@/css/index.css'
import { Locale, LocaleType } from '@/i18n/config'
import { getEnvironment } from '@/i18n/environment'
import { configureZod } from '@/lib/zod.config'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { Environment } from '@prisma/client'
import type { Metadata } from 'next'
import { getLocale, getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { WrapperNextIntlClientProvider } from './IntlProvider'

export const metadata: Metadata = {
  title: 'Bilan Carbone +',
  description: 'Découvrez le logiciel Bilan Carbone +',
}

interface Props {
  children: React.ReactNode
}

const RootLayout = async ({ children }: Readonly<Props>) => {
  const environment = await getEnvironment()
  const t = await getTranslations()

  const locale = environment === Environment.CUT ? Locale.FR : await getLocale()
  if (environment === Environment.CUT) {
    setRequestLocale(Locale.FR)
  }

  // Configure Zod for server-side rendering
  configureZod(locale as LocaleType, t)

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  const providerOptions = { key: 'mui', nonce: (await headers()).get('x-nonce') || undefined, prepend: true }
  return (
    <html lang={locale} className={environment}>
      <body>
        <AppRouterCacheProvider options={providerOptions}>
          <WrapperNextIntlClientProvider locale={locale} environment={environment} messages={messages}>
            {children}
          </WrapperNextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

export default RootLayout
