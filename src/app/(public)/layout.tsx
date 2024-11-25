import PublicPage from '@/components/pages/Public'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

const PublicLayout = ({ children }: Props) => {
  return (
    <main>
      <PublicPage>{children}</PublicPage>
    </main>
  )
}

export default PublicLayout
