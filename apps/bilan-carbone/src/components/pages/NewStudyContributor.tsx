import { getOrganizationVersionAccounts } from '@/db/organization'
import type { FullStudy } from '@/db/study'
import { Typography } from '@mui/material'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NewStudyContributorForm from '../study/rights/NewStudyContributorForm'

interface Props {
  study: FullStudy
}

const NewStudyContributorPage = async ({ study }: Props) => {
  const tNav = await getTranslations('nav')
  const tCommon = await getTranslations('common')
  const t = await getTranslations('study.rights.newContributor')
  const accounts = await getOrganizationVersionAccounts(study.organizationVersionId)

  return (
    <>
      <Breadcrumbs
        current={tNav('newStudyContributor')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyRights'), link: `/etudes/${study.id}/cadrage` },
        ].filter((link) => link !== undefined)}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <Typography variant="body2" className="mb2">
          {tCommon('mandatory')}
        </Typography>
        <NewStudyContributorForm study={study} accounts={accounts} />
      </Block>
    </>
  )
}

export default NewStudyContributorPage
