'use client'

import ImportFileModal from '@/components/base/ImportFileModal/ImportFileModal'
import { download } from '@/services/file'
import { Post } from '@/services/posts'
import {
  getImportEmissionSourcesTemplate,
  importEmissionSourcesFromFile,
  previewEmissionSourcesFromFile,
} from '@/services/serverFunctions/importEmissionSources'
import { PreviewEmissionSourceRow } from '@/types/importEmissionSources.types'
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from '../base/ImportFileModal/ImportFileModal.module.css'

interface Props {
  studyId: string
  post?: Post
  siteId?: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const ImportEmissionSourcesModal = ({ studyId, post, siteId, open, onClose, onSuccess }: Props) => {
  const t = useTranslations('study.importEmissionSourcesModal')

  const handleDownloadTemplate = async () => {
    const arrayBuffer = await getImportEmissionSourcesTemplate(studyId, post, siteId)
    download([arrayBuffer], t('templateFileName'), 'xlsx')
  }

  const renderPreviewTable = (rows: PreviewEmissionSourceRow[]) => (
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell className={styles.groupEmpty} />
          <TableCell className={styles.groupEmpty} />
          <TableCell className={styles.groupEmpty} />
          <TableCell colSpan={3} className={styles.groupHeader}>
            {t('groupActivityData')}
          </TableCell>
          <TableCell colSpan={4} className={styles.groupHeader}>
            {t('groupEmissionFactor')}
          </TableCell>
        </TableRow>
        <TableRow className={styles.subHeader}>
          <TableCell>{t('columnSite')}</TableCell>
          <TableCell>{t('columnPost')}</TableCell>
          <TableCell>{t('columnSubPost')}</TableCell>
          <TableCell className={styles.groupFirstCell}>{t('columnName')}</TableCell>
          <TableCell>{t('columnValue')}</TableCell>
          <TableCell>{t('columnUnit')}</TableCell>
          <TableCell className={styles.groupFirstCell}>{t('columnEmissionFactorId')}</TableCell>
          <TableCell>{t('columnEmissionFactorName')}</TableCell>
          <TableCell>{t('columnEmissionFactorValue')}</TableCell>
          <TableCell>{t('columnEmissionFactorUnit')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            <TableCell>{row.site}</TableCell>
            <TableCell>{row.post}</TableCell>
            <TableCell>{row.subPost}</TableCell>
            <TableCell className={classNames('ellipsis', styles.cellName, styles.groupFirstCell)}>{row.name}</TableCell>
            <TableCell>{row.value}</TableCell>
            <TableCell>{row.unit}</TableCell>
            <TableCell className={styles.groupFirstCell}>{row.emissionFactorId}</TableCell>
            <TableCell>{row.emissionFactorName}</TableCell>
            <TableCell>{row.emissionFactorValue}</TableCell>
            <TableCell>{row.emissionFactorUnit}</TableCell>
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
      onPreview={(file, choices) => previewEmissionSourcesFromFile(file, studyId, choices)}
      onConfirmImport={(file, choices) => importEmissionSourcesFromFile(file, studyId, choices)}
      onDownloadTemplate={handleDownloadTemplate}
      renderPreviewTable={renderPreviewTable}
      previewTitle={(count) => t('previewTitle', { count })}
    />
  )
}

export default ImportEmissionSourcesModal
