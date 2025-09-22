'use client'

import { FullStudy } from '@/db/study'
import StudyNavbar from '@/environments/base/studyNavbar/StudyNavbar'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import StudyNavbarCut from '@/environments/cut/studyNavbar/StudyNavbar'
import { Environment } from '@prisma/client'
import { UUID } from 'crypto'

const DynamicStudyNavBar = ({ studyId, study }: { studyId: UUID; study: FullStudy }) => {
  return (
    <DynamicComponent
      environmentComponents={{ [Environment.CUT]: <StudyNavbarCut studyId={studyId} study={study} /> }}
      defaultComponent={<StudyNavbar studyId={studyId} study={study} />}
    />
  )
}

export default DynamicStudyNavBar
