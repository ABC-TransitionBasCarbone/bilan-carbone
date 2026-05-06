'use client'

import type { FullStudy } from '@/db/study'
import { exportEmissionSourcesToExcel } from '@/services/serverFunctions/importEmissionSources'
import { StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { useToast } from '@abc-transitionbascarbone/ui/src/Toast/ToastProvider'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState, useTransition } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import AllPostsInfographyContainer from '../study/infography/AllPostsInfographyContainer'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'
import styles from './StudyContribution.module.css'

const ImportEmissionSourcesModal = dynamic(() => import('../study/ImportEmissionSourcesModal'))

interface Props {
  study: FullStudy
  userRole: StudyRole
  user: UserSession
}

const StudyContributionPage = ({ study }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const tCommon = useTranslations('common')
  const tImport = useTranslations('study.importEmissionSourcesModal')
  const { siteId, studySiteId, setSite } = useStudySite(study)
  const { showSuccessToast } = useToast()
  const [importOpen, setImportOpen] = useState(false)
  const [isExporting, startExportTransition] = useTransition()

  const handleImportSuccess = () => {
    setImportOpen(false)
    showSuccessToast(tImport('success'))
  }

  const handleExport = () => {
    startExportTransition(async () => {
      const arrayBuffer = await exportEmissionSourcesToExcel(study.id)
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = tImport('exportFileName')
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('dataEntry')}
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
        title={tStudyNav('dataEntry')}
        as="h2"
        actions={[
          {
            actionType: 'loadingButton',
            variant: 'outlined',
            className: styles.actionButton,
            startIcon: <FileDownloadIcon />,
            onClick: handleExport,
            loading: isExporting,
            children: tCommon('action.export'),
          },
          {
            actionType: 'loadingButton',
            variant: 'outlined',
            className: styles.actionButton,
            startIcon: <UploadFileIcon />,
            onClick: () => setImportOpen(true),
            loading: false,
            children: tCommon('action.import'),
          },
        ]}
        rightComponent={
          <SelectStudySite sites={study.sites} defaultValue={siteId} setSite={setSite} showAllOption={false} />
        }
      >
        <AllPostsInfographyContainer study={study} studySiteId={studySiteId} siteId={siteId} />
      </Block>
      {importOpen && (
        <ImportEmissionSourcesModal
          studyId={study.id}
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </>
  )
}

export default StudyContributionPage
