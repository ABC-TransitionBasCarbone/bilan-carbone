'use client'
import DebouncedInput from '@/components/base/DebouncedInput'
import type { FullStudy } from '@/db/study'
import { hasAccessToPostTypeform } from '@/services/permissions/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { EmissionSourcesFilters, EmissionSourcesSort } from '@/types/filters'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import LinkButton from '@abc-transitionbascarbone/components/src/base/LinkButton'
import GlossaryModal from '@abc-transitionbascarbone/components/src/modals/GlossaryModal'
import { EmissionSourceCaracterisation } from '@abc-transitionbascarbone/db-common'
import { StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { Post } from '@abc-transitionbascarbone/utils/charts'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo, useState } from 'react'
import styles from '../SubPosts.module.css'
import EmissionSourceButtons from './EmissionSourceButtons'
import StudyPostFilters from './StudyPostFilters'
import blockStyles from './StudyPostsBlock.module.css'
import StudyPostSort from './StudyPostSort'

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
  siteId: string
  display: boolean
  setDisplay: (display: boolean) => void
  children: ReactNode
  filters: EmissionSourcesFilters
  setFilters: (values: Partial<EmissionSourcesFilters>) => void
  caracterisationOptions: EmissionSourceCaracterisation[]
  sort: EmissionSourcesSort
  setSort: (field: EmissionSourcesSort['field'], order: EmissionSourcesSort['order']) => void
  onImportSuccess: () => void
}

const StudyPostsBlock = ({
  post,
  study,
  userRole,
  siteId,
  display,
  setDisplay,
  children,
  filters,
  setFilters,
  caracterisationOptions,
  sort,
  setSort,
  onImportSuccess,
}: Props) => {
  const { environment } = useAppEnvironmentStore()
  const [glossaryTypeform, setGlossaryTypeform] = useState('')
  const tPost = useTranslations('emissionFactors.post')
  const tStudyPost = useTranslations('study.post')

  const showTypeformLink = useMemo(() => {
    if (!environment) {
      return false
    }
    const typeformPosts: Post[] = [Post.DeplacementsDePersonne]
    return (
      process.env.NEXT_PUBLIC_TYPEFORM_DEPLACEMENTS_LINK &&
      hasAccessToPostTypeform(environment) &&
      typeformPosts.includes(post as Post)
    )
  }, [post, environment])

  if (!environment) {
    return null
  }

  return (
    <>
      {showTypeformLink && (
        <Block>
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
        </Block>
      )}
      <Block
        withPadding={!showTypeformLink}
        grow
        title={
          <div className="flex grow gapped">
            <DebouncedInput
              className={classNames(styles.searchInput, 'grow')}
              debounce={500}
              value={filters.search}
              onChange={(newValue) => setFilters({ search: newValue })}
              placeholder={tStudyPost('search')}
              data-testid="emission-source-search-field"
            />
            <StudyPostFilters
              filters={filters}
              setFilters={setFilters}
              study={study}
              post={post}
              caracterisationOptions={caracterisationOptions}
            />
            <StudyPostSort sort={sort} setSort={setSort} />
          </div>
        }
        actions={[
          {
            actionType: 'node',
            node: (
              <EmissionSourceButtons
                studyId={study.id}
                userRole={userRole}
                post={post}
                siteId={siteId}
                hasEmissionSources={study.emissionSources.length > 0}
                onSuccess={onImportSuccess}
              />
            ),
          },
          {
            actionType: 'button',
            className: blockStyles.actionButton,
            onClick: () => setDisplay(!display),
            'aria-expanded': display,
            'aria-controls': 'study-post-infography',
            children: tStudyPost(display ? 'hideInfography' : 'displayInfography'),
          },
        ]}
      >
        {children}
      </Block>
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
    </>
  )
}

export default StudyPostsBlock
