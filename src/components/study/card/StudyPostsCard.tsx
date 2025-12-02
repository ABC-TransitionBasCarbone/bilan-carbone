import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { withInfobulle } from '@/utils/post'
import { defaultPostColor, postColors } from '@/utils/study'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo } from 'react'
import progressStyles from '../../base/ProgressBar.module.css'
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
  setGlossary: (glossary: string) => void
}
const StudyPostsCard = ({ study, post, userRole, studySite, setSite, isCut, setGlossary }: Props) => {
  const t = useTranslations('study')
  const tRole = useTranslations('study.role')
  const tPost = useTranslations('emissionFactors.post')

  const postColor = useMemo(() => (post ? postColors[post] : defaultPostColor), [post])

  const emissionSources = study.emissionSources.filter(
    (emissionSource) =>
      subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
  )
  const validated = emissionSources.filter((emissionSource) => emissionSource.validated).length
  const percent = emissionSources.length ? Math.floor((validated / emissionSources.length) * 100) : 0

  return (
    <div className={classNames(styles.card, 'flex-col px1')}>
      <div className="justify-between align-center">
        <StudyName name={study.name} />
        <SelectStudySite
          sites={study.sites}
          defaultValue={studySite}
          setSite={setSite}
          withLabel={false}
          showAllOption={false}
        />
      </div>
      <div className={classNames(styles.post, styles[`post-${postColor}`], 'flex-cc')}>
        <div className={classNames(styles.header, 'flex-col align-center grow')}>
          {percent > 0 && (
            <div
              className={classNames(
                styles.progress,
                styles[`progress-${postColor}`],
                progressStyles[`w${percent.toFixed(0)}`],
              )}
            />
          )}
          <div className={classNames(styles.content, 'flex-cc text-center p1 w100')}>
            <PostIcon className={styles.icon} post={post} />
            {tPost(post)}
            {withInfobulle(post) && (
              <HelpOutlineIcon
                className={classNames(styles.icon, 'pointer ml-2')}
                onClick={() => setGlossary(post)}
                aria-label={tPost('glossary')}
                titleAccess={tPost('glossary')}
              />
            )}
          </div>
        </div>
      </div>
      {!isCut && (
        <div className="flex-col align-end">
          <div>
            <div className={classNames(styles.emissionSources, { [styles.allValidated]: percent === 100 })}>
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
            </div>
          </div>
          <div>
            <div className={classNames(styles.role, styles[userRole.toLowerCase()], 'ml-2 text-center')}>
              {tRole(userRole)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudyPostsCard
