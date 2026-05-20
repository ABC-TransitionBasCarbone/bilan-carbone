'use client'

import LoadingButton from '@/components/base/LoadingButton'
import ImportEmissionSourcesModal from '@/components/study/ImportEmissionSourcesModal'
import { download } from '@/services/file'
import { Post } from '@/services/posts'
import {
  exportEmissionSourcesToCSV,
  exportEmissionSourcesToExcel,
} from '@/services/serverFunctions/importEmissionSources'
import { hasEditionRights } from '@/utils/study'
import { StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { ButtonGroup, Menu, MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import styles from './EmissionSourceButtons.module.css'

interface Props {
  studyId: string
  userRole: StudyRole
  post?: Post
  siteId?: string
  hasEmissionSources: boolean
  onSuccess: () => void
}

const EmissionSourceButtons = ({ studyId, userRole, post, siteId, hasEmissionSources, onSuccess }: Props) => {
  const tCommon = useTranslations('common')
  const tImport = useTranslations('study.importEmissionSourcesModal')
  const [importOpen, setImportOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [isExporting, startExportTransition] = useTransition()

  const canEdit = hasEditionRights(userRole)

  const handleExportExcel = () => {
    setMenuAnchor(null)
    startExportTransition(async () => {
      const arrayBuffer = await exportEmissionSourcesToExcel(studyId, post)
      download([arrayBuffer], tImport('exportFileName'), 'xlsx')
    })
  }

  const handleExportCsv = () => {
    setMenuAnchor(null)
    startExportTransition(async () => {
      const csvContent = await exportEmissionSourcesToCSV(studyId, post)
      download(['\ufeff', csvContent], tImport('exportFileNameCsv'), 'csv')
    })
  }

  const handleImportSuccess = () => {
    setImportOpen(false)
    onSuccess()
  }

  return (
    <>
      <ButtonGroup>
        {canEdit && (
          <LoadingButton
            isLarge
            className={styles.button}
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={() => setImportOpen(true)}
            loading={false}
          >
            {tCommon('action.import')}
          </LoadingButton>
        )}
        <LoadingButton
          isLarge
          className={styles.button}
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          endIcon={<KeyboardArrowDownIcon />}
          loading={isExporting}
          disabled={!hasEmissionSources}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          {tCommon('action.export')}
        </LoadingButton>
      </ButtonGroup>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={handleExportExcel}>{tImport('exportExcel')}</MenuItem>
        <MenuItem onClick={handleExportCsv}>{tImport('exportCsv')}</MenuItem>
      </Menu>
      {importOpen && (
        <ImportEmissionSourcesModal
          studyId={studyId}
          post={post}
          siteId={siteId}
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </>
  )
}

export default EmissionSourceButtons
