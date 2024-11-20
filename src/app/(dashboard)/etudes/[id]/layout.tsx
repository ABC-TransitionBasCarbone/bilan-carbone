import StudyNavbar from '@/components/studyNavbar/studyNavbar'
import { UUID } from 'crypto'

interface Props {
  children: React.ReactNode,
  params: Promise<{
    id: UUID
  }>
}

const NavLayout = async ({ children, params }: Props) => {
  const { id } = await params;

  return (
    <div className="flex-row">
      <StudyNavbar studyId={id} />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}

export default NavLayout
