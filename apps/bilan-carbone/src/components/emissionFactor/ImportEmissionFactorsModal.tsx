'use client'

import ImportFileModal from '@/components/base/ImportFileModal'
import { useServerFunction } from '@/hooks/useServerFunction'
import { downloadFromUrl } from '@/services/file'
import {
  getImportEmissionFactorsTemplateUrl,
  importEmissionFactorsFromFile,
  previewEmissionFactorsFromFile,
} from '@/services/serverFunctions/importEmissionFactors'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ImportEmissionFactorsModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type PreviewRow = {
  name: string
  source: string
  unit: string
  customUnit: string | null
  totalCo2: number
  postsAndSubPosts: string
}

const ImportEmissionFactorsModal = ({ open, onClose, onSuccess }: Props) => {
  const t = useTranslations('emissionFactors.importModal')
  const tCommon = useTranslations('common')

  const { callServerFunction } = useServerFunction()

  const handleDownloadTemplate = async () => {
    await callServerFunction(() => getImportEmissionFactorsTemplateUrl(), {
      onSuccess: (url) => downloadFromUrl(url, t('templateFileName')),
    })
  }

  const renderPreviewTable = (rows: PreviewRow[]) => (
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>{tCommon('label.labelName')}</TableCell>
          <TableCell>{tCommon('label.source')}</TableCell>
          <TableCell>{tCommon('label.unit')}</TableCell>
          <TableCell align="right">{tCommon('label.emissionsKg')}</TableCell>
          <TableCell>{t('previewPostsAndSubPosts')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            <TableCell className={styles.cellName}>{row.name}</TableCell>
            <TableCell>{row.source}</TableCell>
            <TableCell>{row.customUnit ?? row.unit}</TableCell>
            <TableCell align="right">{row.totalCo2}</TableCell>
            <TableCell>{row.postsAndSubPosts}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <ImportFileModal
      open={open}
      label="import-emission-factors"
      title={t('title')}
      onClose={onClose}
      onSuccess={onSuccess}
      onPreview={previewEmissionFactorsFromFile}
      onConfirmImport={importEmissionFactorsFromFile}
      onDownloadTemplate={handleDownloadTemplate}
      renderPreviewTable={renderPreviewTable}
      previewTitle={(count) => t('previewTitle', { count })}
    />
  )
}

export default ImportEmissionFactorsModal
