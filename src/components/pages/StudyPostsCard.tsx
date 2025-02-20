import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { colors, postColors } from '@/utils/study'
import Leaf from '@mui/icons-material/Spa'
import { LinearProgress } from '@mui/material'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo } from 'react'
import Box from '../base/Box'
import PostIcon from '../study/infography/icons/PostIcon'
import SelectStudySite from '../study/site/SelectStudySite'
import styles from './StudyPostsCard.module.css'

interface Props {
  study: FullStudy
  post: Post
  userRole: StudyRole
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
}
const StudyPostsCard = ({ study, post, userRole, studySite, setSite }: Props) => {
  const t = useTranslations('study')
  const tRole = useTranslations('study.role')
  const tPost = useTranslations('emissionFactors.post')

  const postColor = useMemo(() => (post ? postColors[post] : 'green'), [post])

  const emissionSources = study.emissionSources.filter(
    (emissionSource) =>
      subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
  )
  const validated = emissionSources.filter((emissionSource) => emissionSource.validated).length
  const percent = Math.floor((validated / emissionSources.length) * 100)
  const color = emissionSources.length && percent === 100 ? '--green-500' : '--orange-500'

  return (
    <div className="justify-center">
      <Box className={classNames(styles.card, 'flex-col')}>
        <div
          className={classNames(styles.post, 'flex-cc')}
          style={{ borderColor: colors[postColor].dark, color: colors[postColor].dark }}
        >
          <PostIcon className={styles.icon} post={post} />
          {tPost(post)}
        </div>
        <div className={classNames(styles.name, 'justify-between align-center')}>
          <div className="align-center">
            <Leaf />
            <span className="ml-2">{study.name}</span>
          </div>
          <div className={classNames(styles.role, 'text-center')}>{tRole(userRole)}</div>
        </div>
        <p className="text-center">{t('selectSite')}</p>
        <SelectStudySite study={study} studySite={studySite} setSite={setSite} withLabel={false} />
        <Box className={classNames(styles.emissionSources, 'p1', { [styles.allValidated]: percent === 100 })}>
          <p className="mb1 align-center">
            {t.rich('validatedSources', {
              validated: validated,
              total: emissionSources.length,
              data: (children) => (
                <span className={classNames(styles.validated, 'mr-4', { [styles.success]: percent === 100 })}>
                  {children}
                </span>
              ),
            })}
          </p>
          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              backgroundColor: 'var(--greyscale-200)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: `var(${color})`,
              },
            }}
          />
        </Box>
      </Box>
    </div>
  )
}

export default StudyPostsCard
