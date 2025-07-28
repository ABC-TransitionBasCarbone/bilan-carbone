import ProgressBar from '@/components/base/ProgressBar'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { postColors } from '@/utils/study'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo } from 'react'
import Box from '../../base/Box'
import PostIcon from '../infography/icons/PostIcon'
import SelectStudySite from '../site/SelectStudySite'
import StudyName from './StudyName'
import styles from './StudyPostsCard.module.css'

interface Props {
  study: FullStudy
  post: Post
  userRole: StudyRole
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
  isCut: boolean
}
const StudyPostsCard = ({ study, post, userRole, studySite, setSite, isCut }: Props) => {
  const t = useTranslations('study')
  const tRole = useTranslations('study.role')
  const tPost = useTranslations('emissionFactors.post')

  const postColor = useMemo(() => (post ? postColors[post] : 'green'), [post])

  const emissionSources = study.emissionSources.filter(
    (emissionSource) =>
      subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
  )
  const validated = emissionSources.filter((emissionSource) => emissionSource.validated).length
  const percent = emissionSources.length ? Math.floor((validated / emissionSources.length) * 100) : 0

  return (
    <div className="justify-center">
      <Box className={classNames(styles.card, 'flex-col')}>
        <div className={classNames(styles.post, styles[`post-${postColor}`], 'flex-cc')}>
          <PostIcon className={styles.icon} post={post} />
          {tPost(post)}
        </div>
        <div className={`justify-${isCut ? 'center' : 'between'} align-center`}>
          <StudyName name={study.name} />
          {!isCut && (
            <div className={classNames(styles.role, styles[userRole.toLowerCase()], 'ml-2 text-center')}>
              {tRole(userRole)}
            </div>
          )}
        </div>
        <p className="text-center">{t('selectSite')}</p>
        <SelectStudySite study={study} studySite={studySite} setSite={setSite} withLabel={false} />
        {!isCut && (
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
            <ProgressBar
              value={percent}
              barClass={classNames(styles.progressBar, { [styles.success]: percent === 100 })}
            />
          </Box>
        )}
      </Box>
    </div>
  )
}

export default StudyPostsCard
