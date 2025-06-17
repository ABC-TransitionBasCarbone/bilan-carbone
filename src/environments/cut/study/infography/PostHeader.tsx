import { Post } from '@/services/posts'
import { styled } from '@mui/material'
import { StudyResultUnit, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface Props {
  post: Post | SubPost
  mainPost: Post | null
  emissionValue?: number
  percent: number
  color: string
  resultsUnit: StudyResultUnit
}

const StyledPostHeader = styled('div', { shouldForwardProp: (prop) => prop !== 'post' })<{ post: Post }>(
  ({ theme, post }) => ({
    position: 'relative',
    padding: '1rem',
    gap: '0.5rem',
    color: 'white',
    backgroundColor: theme.custom.postColors[post],

    '@media screen and (max-width: 64rem)': {
      padding: '1rem 0.5rem',
    },

    span: {
      '@media screen and (max-width: 90rem)': {
        fontSize: '0.875rem',
      },

      '@media screen and (max-width: 64rem)': {
        fontSize: '0.75rem',
      },

      '@media screen and (max-width: 55rem)': {
        fontSize: '0.625rem',
      },
    },
  }),
)

export const CutPostHeader = ({ post, mainPost, emissionValue, percent, color, resultsUnit }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

  if (!mainPost) {
    return null
  }

  return (
    <StyledPostHeader className="align-center flex-col" post={mainPost}>
      {/* {percent > 0 && (
        <div
          className={classNames(styles.progress, styles[`progress-${color}`], progressStyles[`w${percent.toFixed(0)}`])}
        />
      )} */}
      {/* <div className={styles.content}>
        <div className={classNames(styles.title, 'flex-cc')}>
          <span>{mainPost && <PostIcon className={styles.icon} post={mainPost} />}</span>
          <span>{t(post)}</span>
        </div>
        <span>
          {formatNumber((emissionValue || 0) / STUDY_UNIT_VALUES[resultsUnit])} {tUnits(resultsUnit)}
        </span>
      </div> */}
    </StyledPostHeader>
  )
}
