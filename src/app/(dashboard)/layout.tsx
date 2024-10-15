import Navbar from '@/components/navbar'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className="flex-col">
    <Navbar />
    <main className="m-2 grow">{children}</main>
  </div>
)

export default NavLayout
