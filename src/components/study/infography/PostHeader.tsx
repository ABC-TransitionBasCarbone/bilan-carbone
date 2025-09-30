import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { Post } from '@/services/posts'
import { Environment, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import progressStyles from '../../base/ProgressBar.module.css'
import PostIcon from './icons/PostIcon'
import styles from './PostHeader.module.css'

interface Props {
  post: Post | SubPost
  mainPost: Post | null
  emissionValue: string
  percent: number
  color: string
  environment: Environment
}

export const PostHeader = ({ post, mainPost, emissionValue, percent, color, environment }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const tInfo = useTranslations('postInfographyInfo')
  const shouldDisplayGlossary = environment === Environment.TILT && tInfo.has(post)

  return (
    <div className={classNames(styles.header, 'align-center', 'flex-col')}>
      {percent > 0 && (
        <div
          className={classNames(styles.progress, styles[`progress-${color}`], progressStyles[`w${percent.toFixed(0)}`])}
        />
      )}
      <div className={styles.content}>
        <div className={classNames(styles.title, 'flex-cc')}>
          <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
          <span>{t(post)}</span>
          {shouldDisplayGlossary && (
            <GlossaryIconModal
              title="postInfo"
              className={classNames(styles.glossaryIcon)}
              iconLabel="information"
              label={post}
              tModal="postInfographyInfo"
            >
              {tInfo.rich(post, {
                link: (children) => (
                  <Link className={styles.link} href={tInfo(`${post}Link`)} target="_blank">
                    {children}
                  </Link>
                ),
              })}
            </GlossaryIconModal>
          )}
        </div>
        <span>{emissionValue}</span>
      </div>
    </div>
  )
}
