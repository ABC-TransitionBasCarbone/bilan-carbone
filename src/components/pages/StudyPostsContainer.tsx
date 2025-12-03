'use client'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import StudyPostsPageCut from '@/environments/cut/pages/StudyPostsPage'
import { Post, subPostsByPost } from '@/services/posts'
import { Environment, StudyRole } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import GlossaryModal from '../modals/GlossaryModal'
import StudyPostsCard from '../study/card/StudyPostsCard'
import useStudySite from '../study/site/useStudySite'
import StudyPostsPage from './StudyPostsPage'
import styles from './StudyPostsPage.module.css'

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

  const isCut = useMemo(
    () => study.organizationVersion.environment === Environment.CUT,
    [study.organizationVersion.environment],
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

    return tPost.rich(textForGlossary, {
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
          userRole={userRole as StudyRole}
          studySite={studySite}
          setSite={setSite}
          isCut={isCut}
          setGlossary={setGlossary}
        />
      </Block>
      <DynamicComponent
        defaultComponent={
          <StudyPostsPage
            post={post}
            study={study}
            userRole={userRole}
            emissionSources={emissionSources}
            studySite={studySite}
            user={user}
            setGlossary={setGlossary}
          />
        }
        environmentComponents={{
          [Environment.CUT]: <StudyPostsPageCut post={post} study={study} studySiteId={studySite} />,
        }}
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
