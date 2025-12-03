'use client'

import { FullStudy } from '@/db/study'
import { EmissionFactorImportVersion } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import StudyLevel from './StudyLevel'
import StudyPublicStatus from './StudyPublicStatus'
import StudyResultsUnit from './StudyResultsUnit'
import StudyVersions from './StudyVersions'

interface Props {
  user: UserSession
  study: FullStudy
  disabled: boolean
  emissionFactorSources: EmissionFactorImportVersion[]
}

const StudyParams = ({ user, study, disabled, emissionFactorSources }: Props) => {
  const t = useTranslations('study.rights')

  return (
    <>
      <h3 className="mb1">{t('general')}</h3>
      <div className="flex pb2">
        <StudyLevel study={study} user={user} disabled={disabled} />
        <StudyResultsUnit study={study} disabled={disabled} />
      </div>
      <div className="flex">
        <StudyPublicStatus study={study} user={user} disabled={disabled} />
        <StudyVersions study={study} emissionFactorSources={emissionFactorSources} canUpdate={!disabled} />
      </div>
    </>
  )
}

export default StudyParams
