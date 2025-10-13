import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import { ExternalStudy } from '@prisma/client'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import LinkedStudiesTable from './LinkedStudiesTable'

const LinkingStudyModal = dynamic(() => import('./LinkingStudyModal'), {
  ssr: false,
})

interface Props {
  transitionPlanId: string
  studyId: string
  studyYear: Date
  linkedStudies: FullStudy[]
  externalStudies: ExternalStudy[]
}

const LinkedStudies = ({ transitionPlanId, studyId, studyYear, linkedStudies, externalStudies }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies')
  const [linking, setLinking] = useState(false)

  return (
    <>
      <div className="flex grow justify-between">
        <h2>{t('linked')}</h2>
        <Button onClick={() => setLinking((prev) => !prev)}>{t('linkStudy')}</Button>
      </div>
      {linking && (
        <LinkingStudyModal
          transitionPlanId={transitionPlanId}
          studyId={studyId}
          studyYear={studyYear}
          open={linking}
          onClose={() => setLinking(false)}
        />
      )}
      <LinkedStudiesTable
        transitionPlanId={transitionPlanId}
        linkedStudies={linkedStudies}
        externalStudies={externalStudies}
      />
    </>
  )
}

export default LinkedStudies
