'use client'

import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import type { FullStudy } from '@/db/study'
import { EngagementActionWithSites } from '@/services/serverFunctions/study'
import { downloadEngagementActionsCSV } from '@/services/study'
import DownloadIcon from '@mui/icons-material/Download'
import { Button } from '@repo/ui'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import EngagementActions from '../study/engagement/EngagementActions'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'

interface Props {
  study: FullStudy
  actions: EngagementActionWithSites[]
}

const EngagementActionsPage = ({ study, actions }: Props) => {
  const t = useTranslations('study.engagementActions')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const tTargets = useTranslations('study.engagementActions.targets')
  const tSteps = useTranslations('study.engagementActions.steps')
  const tPhases = useTranslations('study.engagementActions.phases')
  const { siteId, studySiteId, setSite } = useStudySite(study, true)

  const handleExportCSV = () => {
    downloadEngagementActionsCSV(actions, study.name, t, tTargets, tSteps, tPhases)
  }

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('actionPlan')}
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
      <Block
        title={t('title')}
        as="h2"
        rightComponent={
          <div className="flex gapped1 align-center">
            <Button onClick={handleExportCSV} variant="outlined" isLarge>
              <DownloadIcon className="mr-2" /> {t('export')}
            </Button>
            <SelectStudySite sites={study.sites} defaultValue={siteId} setSite={setSite} />
          </div>
        }
      >
        <div className="flex-col gapped2">
          <EngagementActions actions={actions} study={study} studySite={studySiteId} />
        </div>
      </Block>
    </>
  )
}

export default EngagementActionsPage
