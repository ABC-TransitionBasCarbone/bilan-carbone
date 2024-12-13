'use client'

import { FullStudy } from '@/db/study'
import { uploadDocument } from '@/services/serverFunctions/file'
import { Document } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyFlow from '../study/perimeter/StudyFlow'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'

interface Props {
  study: FullStudy
  user: User
  flow: Document | null
}

const StudyPerimeterPage = ({ study, user, flow }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('study.perimeter')

  const userRoleOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)

  const addFlow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      uploadDocument(file, study.id)
    } catch (error) {
      console.error('Erreur lors de l’upload :', error)
    }
  }

  return (
    <>
      <Breadcrumbs
        current={tNav('studyPermimeter')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyPerimeter study={study} userRoleOnStudy={userRoleOnStudy} />
      </Block>
      {flow ? (
        <Block
          title={t('flows', { name: study.name })}
          as="h1"
          actions={[
            {
              actionType: 'button',
              children: <input type="file" accept="application/pdf" onChange={addFlow} />,
            },
          ]}
        >
          <StudyFlow document={flow} />
        </Block>
      ) : (
        <Block>
          <div>
            <input type="file" accept="application/pdf" onChange={addFlow} />
          </div>
        </Block>
      )}
    </>
  )
}

export default StudyPerimeterPage
