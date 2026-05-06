'use client'

import ImportFileModal from '@/components/base/ImportFileModal'
import {
  getImportEmissionSourcesTemplate,
  importEmissionSourcesFromFile,
  previewEmissionSourcesFromFile,
} from '@/services/serverFunctions/importEmissionSources'
import { PreviewEmissionSourceRow } from '@/types/importEmissionSources.types'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from '../base/ImportFileModal.module.css'

interface Props {
  studyId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const ImportEmissionSourcesModal = ({ studyId, open, onClose, onSuccess }: Props) => {
  const t = useTranslations('study.importEmissionSourcesModal')

  const handleDownloadTemplate = async () => {
    const arrayBuffer = await getImportEmissionSourcesTemplate(studyId)
    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t('sheetName') + '.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderPreviewTable = (rows: PreviewEmissionSourceRow[]) => (
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>{t('columnSite')}</TableCell>
          <TableCell>{t('columnSubPost')}</TableCell>
          <TableCell>{t('columnName')}</TableCell>
          <TableCell>{t('columnEmissionFactor')}</TableCell>
          <TableCell>{t('columnValue')}</TableCell>
          <TableCell>{t('columnType')}</TableCell>
          <TableCell>{t('columnSource')}</TableCell>
          <TableCell>{t('columnQuality')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            <TableCell>{row.site}</TableCell>
            <TableCell>{row.subPost}</TableCell>
            <TableCell className={classNames('ellipsis', styles.cellName)}>{row.name}</TableCell>
            <TableCell>{row.emissionFactorName}</TableCell>
            <TableCell>{row.value}</TableCell>
            <TableCell>{row.type}</TableCell>
            <TableCell>{row.source}</TableCell>
            <TableCell>{row.quality}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <ImportFileModal
      open={open}
      label="import-emission-sources"
      title={t('title')}
      onClose={onClose}
      onSuccess={onSuccess}
      onPreview={(file) => previewEmissionSourcesFromFile(file, studyId)}
      onConfirmImport={(file) => importEmissionSourcesFromFile(file, studyId)}
      onDownloadTemplate={handleDownloadTemplate}
      renderPreviewTable={renderPreviewTable}
      previewTitle={(count) => t('previewTitle', { count })}
    />
  )
}

export default ImportEmissionSourcesModal
