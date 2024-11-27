'use client'

import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { downloadStudyPost } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import classNames from 'classnames'
import { useState } from 'react'
import { useTranslations } from 'use-intl'
import Button from '../../base/Button'
import PostInfography from './PostsInfography'
import styles from './StudyPostInfography.module.css'

interface Props {
  post: Post
  study: FullStudy
}

const StudyPostInfography = ({ post, study }: Props) => {
  const t = useTranslations('study.post')
  const tExport = useTranslations('study.export')
  const tQuality = useTranslations('quality')
  const [display, setDisplay] = useState(false)

  return (
    <>
      <div className={classNames(styles.buttons, 'flex')}>
        <Button onClick={() => downloadStudyPost(study, post, tExport, tQuality)}>
          {tExport('download')}
          <DownloadIcon />
        </Button>
        <Button onClick={() => setDisplay(!display)} aria-expanded={display} aria-controls="study-post-infography">
          {t(display ? 'hideInfography' : 'displayInfography')}
        </Button>
      </div>

      {display && (
        <div className={styles.infography} id="study-post-infography">
          <PostInfography hideSubPosts study={study} />
        </div>
      )}
    </>
  )
}

export default StudyPostInfography
