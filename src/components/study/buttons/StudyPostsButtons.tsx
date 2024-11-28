'use client'

import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { downloadStudyPost } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
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

  const validSubPosts = useMemo(() => subPostsByPost[post], [post])
  const emissionSources = useMemo(
    () =>
      study.emissionSources
        .filter((emissionSource) => validSubPosts.includes(emissionSource.subPost))
        .sort((a, b) => a.subPost.localeCompare(b.subPost)),
    [study, validSubPosts],
  )

  return (
    <div className={classNames(styles.buttons, 'flex')}>
      <Button
        onClick={() => downloadStudyPost(study, emissionSources, post, tExport, tPost, tQuality)}
        disabled={emissionSources.length === 0}
      >
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
