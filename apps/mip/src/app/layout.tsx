import '@/css/index.css'
import Providers from '@repo/lib'
import { CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'MIP : Mon Impact Pro',
  description: 'Calculez votre impact carbone professionnel',
}

interface Props {
  children: React.ReactNode
}

const RootLayout = async ({ children }: Readonly<Props>) => {
  const messages = await getMessages()
  const providerOptions = {
    key: 'mui',
    nonce: (await headers()).get('x-nonce') || undefined,
    prepend: true,
  }
  return (
    <html lang="fr">
      <body>
        <AppRouterCacheProvider options={providerOptions}>
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <CssBaseline />
              {children}
            </Providers>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

export default RootLayout
