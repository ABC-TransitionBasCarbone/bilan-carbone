import Navbar from '@/components/navbar/Navbar'
import Providers from '@/services/providers/Providers'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className="flex-col">
    <Navbar />
    <main className="m-2 grow">
      <Providers>{children}</Providers>
    </main>
  </div>
)

export default NavLayout
