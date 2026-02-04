'use client'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
import { customRich } from '@/i18n/customRich'
import { Post, subPostsByPost } from '@/services/posts'
import { Environment, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import GlossaryModal from '../modals/GlossaryModal'
import StudyPostsCard from '../study/card/StudyPostsCard'
import useStudySite from '../study/site/useStudySite'
import styles from './StudyPostsPage.module.css'

const StudyPostsPageCut = dynamic(() => import('@/environments/cut/pages/StudyPostsPage'))
const StudyPostsPage = dynamic(() => import('@/components/pages/StudyPostsPage'))

interface Props {
  post: Post
  study: FullStudy
  userRole: StudyRole
  user: UserSession
}

const StudyPostsPageContainer = ({ post, study, userRole, user }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  const { studySite, setSite } = useStudySite(study)
  const [glossary, setGlossary] = useState('')

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) =>
          subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.id === studySite,
      ) as FullStudy['emissionSources'],
    [study, post, studySite],
  )

  const glossaryDescription = useMemo(() => {
    if (!glossary) {
      return ''
    }

    const textForGlossary = tPost.has(
      `glossaryDescription.${glossary}${study.organizationVersion.environment.toLowerCase()}`,
    )
      ? `glossaryDescription.${glossary}${study.organizationVersion.environment.toLowerCase()}`
      : `glossaryDescription.${glossary}`

    return customRich(tPost, textForGlossary, {
      link: (children) => (
        <Link className={styles.link} href={tPost(`${textForGlossary}Link`)} target="_blank" rel="noreferrer noopener">
          {children}
        </Link>
      ),
    })
  }, [glossary, study.organizationVersion.environment, tPost])

  return (
    <>
      <Breadcrumbs
        current={tPost(post)}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,

          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <Block>
        <StudyPostsCard
          study={study}
          post={post}
          studySite={studySite}
          setSite={setSite}
          environment={study.organizationVersion.environment}
          setGlossary={setGlossary}
        />
      </Block>
      <DynamicComponent
        defaultComponent={typeDynamicComponent({
          component: StudyPostsPage,
          props: {
            post,
            study,
            userRole,
            emissionSources,
            studySite,
            user,
            setGlossary,
          },
        })}
        environmentComponents={{
          [Environment.CUT]: typeDynamicComponent({
            component: StudyPostsPageCut,
            props: { post, study, studySiteId: studySite },
          }),
        }}
        environment={study.organizationVersion.environment}
      />

      {glossary && (
        <GlossaryModal glossary={glossary} label="post-glossary" t={tPost} onClose={() => setGlossary('')}>
          {glossaryDescription}
        </GlossaryModal>
      )}
    </>
  )
}

export default StudyPostsPageContainer
