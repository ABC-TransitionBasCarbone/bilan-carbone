'use client'

import type { FullStudy } from '@/db/study'
import { environmentPostMapping, Post, subPostsByPost } from '@/services/posts'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { withInfobulle } from '@/utils/post'
import { HelpIcon } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import GlossaryModal from '../modals/GlossaryModal'
import PostIcon from '../study/infography/icons/PostIcon'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'
import SubPosts from '../study/SubPosts'

interface Props {
  study: FullStudy
  userRole: StudyRole | null
}

const StudyContributorPage = ({ study, userRole }: Props) => {
  'use memo'

  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  const tContributor = useTranslations('study.contributor')
  const [glossary, setGlossary] = useState('')
  const { siteId, studySiteId, setSite } = useStudySite(study)
  const { environment } = useAppEnvironmentStore()

  const emissionSources = study.emissionSources.filter(
    (emissionSource) => emissionSource.studySite.site.id === siteId,
  ) as FullStudy['emissionSources']

  const subPostsToshow = Object.values(environmentPostMapping[environment || Environment.BC]).filter((post: Post) =>
    study.emissionSources.some((emissionSource) => subPostsByPost[post].includes(emissionSource.subPost)),
  )

  return (
    <>
      <Breadcrumbs current={study.name} links={[{ label: tNav('home'), link: '/' }]} />
      <Block
        title={study.name}
        as="h2"
        rightComponent={
          <SelectStudySite sites={study.sites} defaultValue={siteId} setSite={setSite} showAllOption={false} />
        }
      >
        {subPostsToshow.length > 0 ? (
          subPostsToshow.map((post: Post) => (
            <Block
              key={post}
              title={
                <>
                  {tPost(post)}{' '}
                  {withInfobulle(post) && <HelpIcon label={tPost('glossary')} onClick={() => setGlossary(post)} />}
                </>
              }
              icon={<PostIcon post={post} />}
              iconPosition="before"
            >
              <SubPosts
                post={post}
                subPosts={subPostsByPost[post]}
                study={study}
                emissionSources={emissionSources}
                studySiteId={studySiteId}
                userRole={userRole}
                setGlossary={setGlossary}
                withoutDetail={true}
              />
            </Block>
          ))
        ) : (
          <div>{tContributor('noData')}</div>
        )}
        {glossary && (
          <GlossaryModal glossary={glossary} label="post-glossary" t={tPost} onClose={() => setGlossary('')}>
            {tPost(`glossaryDescription.${glossary}`)}
          </GlossaryModal>
        )}
      </Block>
    </>
  )
}

export default StudyContributorPage
