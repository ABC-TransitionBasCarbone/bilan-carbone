'use client'

import { FullStudy } from '@/db/study'
import { downloadStudyEmissionSources } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import { useTranslations } from 'next-intl'
import Button from '../base/Button'

interface Props {
  study: FullStudy
}

const DownloadEmissionSourcesButton = ({ study }: Props) => {
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')

  return (
    <Button onClick={() => downloadStudyEmissionSources(study, tExport, tPost, tQuality)}>
      {tExport('download')}
      <DownloadIcon />
    </Button>
  )
}

export default DownloadEmissionSourcesButton
