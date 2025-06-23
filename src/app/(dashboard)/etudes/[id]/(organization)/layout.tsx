import withAuth from '@/components/hoc/withAuth'
import WithStudyDetails from '@/components/hoc/withStudyDetails'
import StudyNavbarContainer from '@/components/studyNavbar/StudyNavbarContainer'
import { UUID } from 'crypto'
import styles from './layout.module.css'

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
      <div className="flex">
        <StudyNavbarContainer studyId={id} />
        <div className={styles.children}>{children}</div>
      </div>
    </>
  )
}

export default withAuth(WithStudyDetails(NavLayout))
