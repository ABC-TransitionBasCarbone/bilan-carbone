'use client'

import { FullStudy } from '@/db/study'
import { OrganizationWithSites } from '@/db/user'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EditStudySitesForm from '../study/edit/EditStudySitesForm'

interface Props {
  study: FullStudy
  organization: OrganizationWithSites
}

const EditStudyPerimeterPage = ({ study, organization }: Props) => {
  const tNav = useTranslations('nav')
  return (
    <>
      <Breadcrumbs
        current={tNav('edit')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyPerimeter'), link: `/etudes/${study.id}/perimetre` },
        ]}
      />
      <Block>
        <EditStudySitesForm study={study} organization={organization} />
      </Block>
    </>
  )
}

export default EditStudyPerimeterPage
