import withAuth from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import WithStudyDetails from '@/components/hoc/withStudyDetails'
import StudyNavbar from '@/components/studyNavbar/StudyNavbar'
import { UUID } from 'crypto'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
  params: Promise<{
    id: UUID
  }>
}

const NavLayout = async ({ children, params, study }: Props & StudyProps) => {
  const { id } = await params
  const environment = study.organizationVersion.environment

  return (
    <>
      <div className="flex">
        <StudyNavbar environment={environment} studyId={id} study={study} />
        <div className={styles.children}>{children}</div>
      </div>
    </>
  )
}

export default withAuth(WithStudyDetails(NavLayout))
