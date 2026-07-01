'use client'

import type { FullStudy } from '@/db/study'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useFormatter, useTranslations } from 'next-intl'
import styles from './StudyDetailsHeader.module.css'
import StudyManagementActions from './StudyManagementActions'
import SelectStudySite from './site/SelectStudySite'

interface Props {
  study: FullStudy
  organizationVersionId: string | null
  canDeleteStudy?: boolean
  canDuplicateStudy?: boolean
  duplicableEnvironments: Environment[]
  studySite: string
  setSite: (site: string) => void
}

const StudyDetailsHeader = ({
  study,
  organizationVersionId,
  canDeleteStudy,
  canDuplicateStudy,
  duplicableEnvironments,
  studySite,
  setSite,
}: Props) => {
  const format = useFormatter()
  const tExport = useTranslations('exports')

  return (
    <StudyManagementActions
      study={study}
      organizationVersionId={organizationVersionId}
      canDeleteStudy={canDeleteStudy}
      canDuplicateStudy={canDuplicateStudy}
      duplicableEnvironments={duplicableEnvironments}
    >
      {(actions) => (
        <Block
          title={study.name}
          as="h2"
          icon={study.isPublic ? <LockOpenIcon /> : <LockIcon />}
          actions={actions}
          description={
            <div className={styles.studyInfo}>
              <p>
                {format.dateTime(study.startDate, { year: 'numeric', day: 'numeric', month: 'long' })} -{' '}
                {format.dateTime(study.endDate, { year: 'numeric', day: 'numeric', month: 'long' })}
              </p>
              {study.exports && study.exports.types.length > 0 && (
                <p>
                  {tExport('title')} {study.exports.types.join(', ')}
                </p>
              )}
            </div>
          }
          rightComponent={<SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} />}
        />
      )}
    </StudyManagementActions>
  )
}

export default StudyDetailsHeader
