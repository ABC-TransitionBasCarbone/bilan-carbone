'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { downloadStudyPost } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Button from '../../base/Button'
import styles from './StudyPostsButtons.module.css'

interface Props {
  post: Post
  study: FullStudy
  display: boolean
  setDisplay: (display: boolean) => void
}

const StudyPostsButtons = ({ post, study, display, setDisplay }: Props) => {
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tStudyPost = useTranslations('study.post')
  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <Button onClick={() => downloadStudyPost(study, post, tExport, tPost, tQuality)}>
        {tExport('download')}
        <DownloadIcon />
      </Button>
      <Button onClick={() => setDisplay(!display)} aria-expanded={display} aria-controls="study-post-infography">
        {tStudyPost(display ? 'hideInfography' : 'displayInfography')}
      </Button>
    </div>
  )
}

export default StudyPostsButtons
