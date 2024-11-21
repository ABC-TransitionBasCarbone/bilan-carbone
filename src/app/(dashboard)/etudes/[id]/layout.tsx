import StudyNavbar from '@/components/studyNavbar/StudyNavbar'
import { UUID } from 'crypto'

interface Props {
  children: React.ReactNode
  params: Promise<{
    id: UUID
  }>
}

const NavLayout = async ({ children, params }: Props) => {
  const { id } = await params

  return (
    <>
      <StudyNavbar studyId={id} />
      {children}
    </>
  )
}

export default NavLayout
