'use client'
import Block from '@/components/base/Block'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { downloadStudyPost } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo } from 'react'
import PostIcon from '../infography/icons/PostIcon'

interface Props {
  post: Post
  study: FullStudy
  display: boolean
  setDisplay: (display: boolean) => void
  children: ReactNode
}

const StudyPostsBlock = ({ post, study, display, setDisplay, children }: Props) => {
  const tCaract = useTranslations('categorisations')
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tStudyPost = useTranslations('study.post')
  const tUnit = useTranslations('units')

  const validSubPosts = useMemo(() => subPostsByPost[post], [post])
  const emissionSources = useMemo(
    () =>
      study.emissionSources
        .filter((emissionSource) => validSubPosts.includes(emissionSource.subPost))
        .sort((a, b) => a.subPost.localeCompare(b.subPost)),
    [study, validSubPosts],
  )

  return (
    <Block
      title={tPost(post)}
      icon={<PostIcon post={post} />}
      iconPosition="before"
      actions={[
        {
          actionType: 'button',
          onClick: () => downloadStudyPost(study, emissionSources, post, tExport, tCaract, tPost, tQuality, tUnit),
          disabled: emissionSources.length === 0,
          children: (
            <>
              {tExport('download')}
              <DownloadIcon />
            </>
          ),
        },
        {
          actionType: 'button',
          onClick: () => setDisplay(!display),
          'aria-expanded': display,
          'aria-controls': 'study-post-infography',
          children: tStudyPost(display ? 'hideInfography' : 'displayInfography'),
        },
      ]}
    >
      {children}
    </Block>
  )
}

export default StudyPostsBlock
