'use client'
import { EnvironmentMode } from '@/constants/environments'
import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import SimplifiedStudyPostsPage from '@/environments/simplified/study/SimplifiedStudyPostsPage'
import { customRich } from '@/i18n/customRich'
import { Post, subPostsByPost } from '@/services/posts'
import { SimplifiedEnvironment } from '@/services/publicodes/simplifiedPublicodesConfig'
import { CircularProgress } from '@mui/material'
import { StudyRole, SubPost } from '@prisma/client'
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
  currentSubPost: SubPost | undefined
  study: FullStudy
  userRole: StudyRole
  user: UserSession
}

const StudyPostsPageContainer = ({ post, currentSubPost, study, userRole, user }: Props) => {
  const tNav = useTranslations('nav')
  const tPost = useTranslations('emissionFactors.post')
  const { siteId, studySiteId, setSite } = useStudySite(study)
  const [glossary, setGlossary] = useState('')
  const environment = study.organizationVersion.environment

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) =>
          subPostsByPost[post].includes(emissionSource.subPost) && emissionSource.studySite.site.id === siteId,
      ) as FullStudy['emissionSources'],
    [study, post, siteId],
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

  if (!siteId) {
    return <CircularProgress />
  }

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
          studySite={siteId}
          setSite={setSite}
          environment={study.organizationVersion.environment}
          setGlossary={setGlossary}
        />
      </Block>
      <DynamicComponent
        defaultComponent={
          !study.simplified ? (
            <StudyPostsPage
              post={post}
              study={study}
              userRole={userRole}
              emissionSources={emissionSources}
              siteId={siteId}
              studySiteId={studySiteId}
              user={user}
              setGlossary={setGlossary}
            />
          ) : (
            <SimplifiedStudyPostsPage
              environment={environment as SimplifiedEnvironment}
              currentSubPost={currentSubPost}
              post={post}
              study={study}
              studySiteId={studySiteId}
            />
          )
        }
        environmentComponents={{
          [EnvironmentMode.SIMPLIFIED]: (
            <SimplifiedStudyPostsPage
              environment={environment as SimplifiedEnvironment}
              currentSubPost={currentSubPost}
              post={post}
              study={study}
              studySiteId={studySiteId}
            />
          ),
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
