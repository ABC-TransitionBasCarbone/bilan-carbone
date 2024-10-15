import Navbar from '@/components/navbar'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className="flex-col">
    <Navbar />
    <div className="m-2 grow">{children}</div>
  </div>
)

export default NavLayout
