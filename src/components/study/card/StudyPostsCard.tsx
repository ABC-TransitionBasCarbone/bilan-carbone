import LinkButton from '@/components/base/LinkButton'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { hasAccessToEmissionSourceValidation, hasAccessToPostTypeform } from '@/services/permissions/environment'
import { Post, subPostsByPost } from '@/services/posts'
import { withInfobulle } from '@/utils/post'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import PostIcon from '../infography/icons/PostIcon'
import SelectStudySite from '../site/SelectStudySite'
import styles from './StudyPostsCard.module.css'
import { StyledPostContainer, StyledProgressLayer } from './StudyPostsCard.styles'

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

  const [glossaryTypeform, setGlossaryTypeform] = useState('')

  const emissionSources = study.emissionSources.filter(
    (emissionSource) =>
      subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
  )
  const validated = emissionSources.filter((emissionSource) => emissionSource.validated).length
  const percent = emissionSources.length ? Math.floor((validated / emissionSources.length) * 100) : 0

  const showTypeformLink = useMemo(() => {
    const typeformPosts: Post[] = [Post.DeplacementsDePersonne, Post.TransportDeMarchandises]
    return (
      process.env.NEXT_PUBLIC_TYPEFORM_DEPLACEMENTS_LINK &&
      hasAccessToPostTypeform(environment) &&
      typeformPosts.includes(post as Post)
    )
  }, [post, environment])

  return (
    <div className={classNames(styles.card, 'flex-col px1')}>
      {showTypeformLink && (
        <div className="justify-end align-center">
          <LinkButton href={process.env.NEXT_PUBLIC_TYPEFORM_DEPLACEMENTS_LINK} rel="noreferrer noopener">
            {tPost('seeTypeform')}
          </LinkButton>
          <HelpOutlineIcon
            color="secondary"
            className="pointer ml-2"
            onClick={() => setGlossaryTypeform(tPost('seeTypeformDescription'))}
            aria-label={tPost('seeTypeform')}
            titleAccess={tPost('seeTypeform')}
          />
        </div>
      )}
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
          <StyledPostContainer post={post}>
            <div className={classNames(styles.header, 'flex-col align-center grow')}>
              {percent > 0 && <StyledProgressLayer post={post} percent={percent} />}
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
          </StyledPostContainer>
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
      {glossaryTypeform && (
        <GlossaryModal
          glossary={'seeTypeform'}
          label="typeform-glossary"
          t={tPost}
          onClose={() => setGlossaryTypeform('')}
        >
          {glossaryTypeform}
        </GlossaryModal>
      )}
    </div>
  )
}

export default StudyPostsCard
