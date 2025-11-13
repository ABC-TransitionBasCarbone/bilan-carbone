import Button from '@/components/base/Button'
import { PastStudy } from '@/utils/trajectory'
import Typography from '@mui/material/Typography'
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
  pastStudies: PastStudy[]
}

const LinkedStudies = ({ transitionPlanId, studyId, studyYear, pastStudies }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies')
  const [linking, setLinking] = useState(false)

  return (
    <div className="flex-col gapped1">
      <div className="flex align-center justify-between">
        <Typography variant="h5" component="h2" fontWeight={600}>
          {t('linked')}
        </Typography>
        {canEdit && <Button onClick={() => setLinking((prev) => !prev)}>{t('linkStudy')}</Button>}
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
      <LinkedStudiesTable transitionPlanId={transitionPlanId} pastStudies={pastStudies} />
    </div>
  )
}

export default LinkedStudies
