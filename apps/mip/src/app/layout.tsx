import RouteChangeListener from '@/components/survey/RouteChangeListener'
import '@/css/index.css'
import Providers from '@/providers/Providers'
import { CssBaseline } from '@mui/material'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import type { Metadata } from 'next'
import { headers } from 'next/headers'

export const metadata: Metadata = {
  title: 'Bilan Carbone +',
  description: 'Découvrez le logiciel Bilan Carbone +',
}

interface Props {
  children: React.ReactNode
}

const RootLayout = async ({ children }: Readonly<Props>) => {
  const providerOptions = {
    key: 'mui',
    nonce: (await headers()).get('x-nonce') || undefined,
    prepend: true,
  }
  return (
    <html lang="fr">
      <body>
        <AppRouterCacheProvider options={providerOptions}>
          <RouteChangeListener />
          <Providers>
            <CssBaseline />
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}

export default RootLayout
