import withAuth from '@/components/hoc/withAuth'
import WithStudyDetails from '@/components/hoc/withStudyDetails'
import DynamicStudyNavBar from '@/components/studyNavbar/DynamicStudyNavBar'
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
        <DynamicStudyNavBar studyId={id} />
        <div className={styles.children}>{children}</div>
      </div>
    </>
  )
}

export default withAuth(WithStudyDetails(NavLayout))
