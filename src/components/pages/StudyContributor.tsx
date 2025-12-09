'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { environmentPostMapping, Post, subPostsByPost } from '@/services/posts'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { withInfobulle } from '@/utils/post'
import { Environment, StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import HelpIcon from '../base/HelpIcon'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import GlossaryModal from '../modals/GlossaryModal'
import PostIcon from '../study/infography/icons/PostIcon'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'
import SubPosts from '../study/SubPosts'

interface Props {
  study: StudyWithoutDetail
  userRole: StudyRole | null
}

const StudyContributorPage = ({ study, userRole }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  const [glossary, setGlossary] = useState('')
  const { studySite, setSite } = useStudySite(study)
  const { environment } = useAppEnvironmentStore()

  const subPosts = subPostsByPost[Post.ConstructionDesLocaux]

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) => emissionSource.studySite.id === studySite,
      ) as FullStudy['emissionSources'],
    [study, studySite],
  )

  return (
    <>
      <Breadcrumbs current={study.name} links={[{ label: tNav('home'), link: '/' }]} />
      <Block
        title={study.name}
        as="h2"
        rightComponent={
          <SelectStudySite sites={study.sites} defaultValue={studySite} setSite={setSite} showAllOption={false} />
        }
      >
        {Object.values(environmentPostMapping[environment || Environment.BC])
          .filter((post: Post) =>
            study.emissionSources.some((emissionSource) => subPostsByPost[post].includes(emissionSource.subPost)),
          )
          .map((post: Post) => (
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
                subPosts={subPostsByPost[post]}
                study={study}
                withoutDetail
                emissionSources={emissionSources}
                studySite={studySite}
                userRole={userRole}
                setGlossary={setGlossary}
              />
            </Block>
          ))}
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
