import { FullStudy } from '@/db/study'
import { hasAccessToEmissionSourceValidation } from '@/services/permissions/environment'
import { Post, subPostsByPost } from '@/services/posts'
import { withInfobulle } from '@/utils/post'
import { defaultPostColor, postColors } from '@/utils/study'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo } from 'react'
import widthStyles from '../../base/ProgressBar.module.css'
import progressStyles from '../infography/PostHeader.module.css'
import PostIcon from '../infography/icons/PostIcon'
import SelectStudySite from '../site/SelectStudySite'
import styles from './StudyPostsCard.module.css'

interface Props {
  study: FullStudy
  post: Post
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
  setGlossary: (glossary: string) => void
  environment: Environment
}
const StudyPostsCard = ({ study, post, studySite, setSite, setGlossary, environment }: Props) => {
  const t = useTranslations('study')
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
      <div className="justify-end align-center">
        <SelectStudySite
          sites={study.sites}
          defaultValue={studySite}
          setSite={setSite}
          withLabel={false}
          showAllOption={false}
        />
      </div>
      <div className={classNames(styles.postContainer, 'grow flex-col gapped')}>
        <div className="grow justify-center">
          <div className={classNames(styles.post, styles[`post-${postColor}`], 'grow')}>
            <div className={classNames(styles.header, 'flex-col align-center grow')}>
              {percent > 0 && (
                <div
                  className={classNames(
                    styles.progress,
                    progressStyles.progress,
                    progressStyles[`progress-${postColor}`],
                    widthStyles[`w${percent.toFixed(0)}`],
                  )}
                />
              )}
              <div className={classNames(styles.content, 'flex-cc text-center w100')}>
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
        </div>
        {hasAccessToEmissionSourceValidation(environment) && (
          <div className={classNames({ [styles.allValidated]: percent === 100 }, 'grow flex-cc')}>
            <p className={classNames(styles.emissionSources, 'mb1 justify-end grow')}>
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
        )}
      </div>
    </div>
  )
}

export default StudyPostsCard
