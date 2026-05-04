'use client'

import LinkButton from '@/components/base/LinkButton'
import LoadingButton from '@/components/base/LoadingButton'
import { useToast } from '@/components/base/ToastProvider'
import { exportManualEmissionFactorsToFile } from '@/services/serverFunctions/importEmissionFactors'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState, useTransition } from 'react'

const ImportEmissionFactorsModal = dynamic(() => import('./ImportEmissionFactorsModal'))

const EmissionFactorButtons = () => {
  const t = useTranslations('emissionFactors')
  const tCommon = useTranslations('common.action')
  const { showSuccessToast } = useToast()
  const [open, setOpen] = useState(false)
  const [isExporting, startExportTransition] = useTransition()

  const handleClose = () => setOpen(false)

  const handleSuccess = () => {
    handleClose()
    showSuccessToast(t('importModal.success'))
  }

  const handleExport = () => {
    startExportTransition(async () => {
      const arrayBuffer = await exportManualEmissionFactorsToFile()
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = t('exportFileName')
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <>
      <div className="flex gapped1 align-center">
        <LoadingButton variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setOpen(true)} loading={false}>
          {tCommon('import')}
        </LoadingButton>

        <LoadingButton variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport} loading={isExporting}>
          {tCommon('export')}
        </LoadingButton>

        <LinkButton
          data-testid="new-emission"
          variant="contained"
          href="/facteurs-d-emission/creer"
          startIcon={<AddIcon />}
        >
          {tCommon('add')}
        </LinkButton>
      </div>
      {open && <ImportEmissionFactorsModal open={open} onClose={handleClose} onSuccess={handleSuccess} />}
    </>
  )
}

export default EmissionFactorButtons
