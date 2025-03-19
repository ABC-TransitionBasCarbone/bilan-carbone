'use client'
import Block from '@/components/base/Block'
import HelpIcon from '@/components/base/HelpIcon'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { downloadStudyPost } from '@/services/study'
import { withInfobulle } from '@/utils/post'
import DownloadIcon from '@mui/icons-material/Download'
import { useTranslations } from 'next-intl'
import { ReactNode, useState } from 'react'
import PostIcon from '../infography/icons/PostIcon'

interface Props {
  post: Post
  study: FullStudy
  display: boolean
  setDisplay: (display: boolean) => void
  children: ReactNode
  emissionSources: FullStudy['emissionSources']
  setGlossary: (post: string) => void
}

const StudyPostsBlock = ({ post, study, display, setDisplay, children, emissionSources, setGlossary }: Props) => {
  const [downloading, setDownloading] = useState(false)
  const tCaracterisations = useTranslations('categorisations')
  const tExport = useTranslations('study.export')
  const tPost = useTranslations('emissionFactors.post')
  const tQuality = useTranslations('quality')
  const tStudyPost = useTranslations('study.post')
  const tUnit = useTranslations('units')
  const tResults = useTranslations('results')

  return (
    <Block
      title={
        <>
          {tPost(post)}
          {withInfobulle.includes(post) && (
            <HelpIcon className="ml-2" label={tPost('glossary')} onClick={() => setGlossary(post)} />
          )}
        </>
      }
      icon={<PostIcon post={post} />}
      iconPosition="before"
      actions={[
        {
          actionType: 'loadingButton',
          onClick: async () => {
            setDownloading(true)
            await downloadStudyPost(
              study,
              emissionSources,
              post,
              tExport,
              tCaracterisations,
              tPost,
              tQuality,
              tUnit,
              tResults,
            )
            setDownloading(false)
          },
          disabled: emissionSources.length === 0,
          loading: downloading,
          children: (
            <>
              {tExport('download')}
              {!downloading && <DownloadIcon />}
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
