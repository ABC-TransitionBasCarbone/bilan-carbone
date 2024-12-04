'use client'
import { FullStudy } from '@/db/study'
import { downloadStudyEmissionSources } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { useFormatter, useTranslations } from 'next-intl'
import Block from '../base/Block'
import styles from './StudyDetailsHeader.module.css'

interface Props {
  study: FullStudy
}
const StudyDetailsHeader = ({ study }: Props) => {
  const format = useFormatter()
  const tExport = useTranslations('study.export')
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
          onClick: () => downloadStudyEmissionSources(study, tExport, tPost, tQuality),
          disabled: study.emissionSources.length === 0,
          children: (
            <>
              {tExport('download')}
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
        </div>
      }
    />
  )
}

export default StudyDetailsHeader
