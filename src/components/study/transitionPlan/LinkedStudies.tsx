'use client'

import { PastStudy } from '@/utils/trajectory'
import type { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import LinkedStudiesTable from './LinkedStudiesTable'
import OnboardingSectionStep from './OnboardingSectionStep'

const LinkingStudyModal = dynamic(() => import('./LinkingStudyModal'), {
  ssr: false,
})

interface Props {
  transitionPlanId: string
  studyId: string
  studyYear: Date
  pastStudies: PastStudy[]
  canEdit: boolean
  studyUnit: StudyResultUnit
  isVisible: boolean
  isActive: boolean
  onClickNext: () => void
}

const LinkedStudies = ({
  transitionPlanId,
  studyId,
  studyYear,
  pastStudies,
  canEdit,
  studyUnit,
  isVisible,
  isActive,
  onClickNext,
}: Props) => {
  const tInit = useTranslations('study.transitionPlan.initialization.stepLinkStudy')
  const tCommon = useTranslations('common')
  const [isModalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PastStudy | null>(null)

  const handleCloseLinking = () => {
    setModalOpen(false)
    setEditTarget(null)
    onClickNext()
  }

  return (
    <>
      <OnboardingSectionStep
        title={tInit('title')}
        description={tInit('description')}
        glossaryLabel="init-step-link-study"
        glossaryTitleKey="glossaryTitle"
        tModal="study.transitionPlan.initialization.stepLinkStudy"
        isVisible={isVisible}
        isActive={isActive}
        onClickNext={onClickNext}
        nextButtonLabel={tCommon('next')}
        titleButtonClick={() => canEdit && setModalOpen(true)}
        titleButtonLabel={canEdit ? tInit('linkStudyButton') : undefined}
        showButtonsInTitle={true}
      >
        {pastStudies.length > 0 ? (
          <LinkedStudiesTable
            transitionPlanId={transitionPlanId}
            pastStudies={pastStudies}
            onEdit={(study) => {
              setEditTarget(study)
              setModalOpen(true)
            }}
            canEdit={canEdit}
            studyUnit={studyUnit}
          />
        ) : null}
      </OnboardingSectionStep>
      {isModalOpen && (
        <LinkingStudyModal
          transitionPlanId={transitionPlanId}
          studyId={studyId}
          studyYear={studyYear}
          studyUnit={studyUnit}
          open={isModalOpen}
          onClose={handleCloseLinking}
          linkedStudyIds={pastStudies.filter((s) => s.type === 'linked').map((s) => s.id)}
          pastStudyToUpdate={editTarget}
        />
      )}
    </>
  )
}

export default LinkedStudies
