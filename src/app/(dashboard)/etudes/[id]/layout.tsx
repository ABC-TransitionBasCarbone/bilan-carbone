import StudyNavbar from '@/components/studyNavbar/studyNavbar'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className="flex-row">
    <StudyNavbar />
    <main style={{ flex: 1 }}>{children}</main>
  </div>
)

export default NavLayout
