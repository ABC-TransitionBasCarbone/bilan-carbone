'use client'

import StudyNavbar from '@/environments/base/studyNavbar/StudyNavbar'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import StudyNavbarCut from '@/environments/cut/studyNavbar/StudyNavbar'
import { Environment } from '@prisma/client'
import { UUID } from 'crypto'

const StudyNavbarContainer = ({ studyId }: { studyId: UUID }) => {
  return (
    <DynamicComponent
      environmentComponents={{ [Environment.CUT]: <StudyNavbarCut studyId={studyId} /> }}
      defaultComponent={<StudyNavbar studyId={studyId} />}
    />
  )
}

export default StudyNavbarContainer
