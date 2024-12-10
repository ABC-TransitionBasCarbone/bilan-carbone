'use client'

import { FullStudy } from '@/db/study'
import { downloadStudyEmissionSources } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useFormatter, useTranslations } from 'next-intl'
import { Dispatch, SetStateAction } from 'react'
import Block from '../base/Block'
import styles from './StudyDetailsHeader.module.css'
import SelectStudySite from './site/SelectStudySite'

interface Props {
  study: FullStudy
  site: string
  setSite: Dispatch<SetStateAction<string>>
}
const StudyDetailsHeader = ({ study, site, setSite }: Props) => {
  const format = useFormatter()
  const t = useTranslations('study.export')
  const tExport = useTranslations('exports')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')

  return (
    <Block
      title={study.name}
      as="h1"
      icon={study.isPublic ? <LockOpenIcon /> : <LockIcon />}
      actions={[
        {
          actionType: 'button',
          onClick: () => downloadStudyEmissionSources(study, t, tPost, tQuality),
          disabled: study.emissionSources.length === 0,
          children: (
            <>
              {t('download')}
              <DownloadIcon />
            </>
          ),
        },
      ]}
      description={
        <div className={styles.studyInfo}>
          <p>
            {format.dateTime(study.startDate, { year: 'numeric', day: 'numeric', month: 'long' })} -{' '}
            {format.dateTime(study.endDate, { year: 'numeric', day: 'numeric', month: 'long' })}
          </p>
          {study.exports.length > 0 && (
            <p>
              {tExport('title')} {study.exports.map((e) => e.type).join(', ')}
            </p>
          )}
        </div>
      }
    >
      <SelectStudySite study={study} allowAll site={site} setSite={setSite} />
    </Block>
  )
}

export default StudyDetailsHeader
