'use client'

import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/modals/Modal'
import { useServerFunction } from '@/hooks/useServerFunction'
import { downloadFromUrl } from '@/services/file'
import {
  getImportEmissionFactorsTemplateUrl,
  importEmissionFactorsFromFile,
  previewEmissionFactorsFromFile,
} from '@/services/serverFunctions/importEmissionFactors'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { DragEvent, useRef, useState, useTransition } from 'react'
import styles from './ImportEmissionFactorsModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type ModalState = 'default' | 'preview' | 'error'
type ImportError = { line: number; key: string; value?: string }
type PreviewRow = { name: string; source: string; unit: string; totalCo2: number; postsAndSubPosts: string }

const ImportEmissionFactorsModal = ({ open, onClose, onSuccess }: Props) => {
  const t = useTranslations('emissionFactors.importModal')
  const tCommon = useTranslations('common')
  const { callServerFunction } = useServerFunction()
  const [isPending, startTransition] = useTransition()
  const [isDownloading, setIsDownloading] = useState(false)
  const [modalState, setModalState] = useState<ModalState>('default')
  const [errors, setErrors] = useState<ImportError[]>([])
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setModalState('default')
    setErrors([])
    setPreviewRows([])
    setIsDragOver(false)
    setPendingFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const previewFile = (file: File) => {
    setErrors([])
    setPendingFile(file)
    startTransition(async () => {
      const result = await previewEmissionFactorsFromFile(file)
      if (result.success) {
        setPreviewRows(result.rows)
        setModalState('preview')
      } else {
        setModalState('error')
        setErrors(result.errors)
      }
    })
  }

  const confirmImport = () => {
    if (!pendingFile) {
      return
    }
    startTransition(async () => {
      const result = await importEmissionFactorsFromFile(pendingFile)
      if (result.success) {
        reset()
        onSuccess()
      } else {
        setModalState('error')
        setErrors(result.errors)
      }
    })
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files?.length) {
      return
    }
    if (files.length > 1) {
      setModalState('error')
      setErrors([{ line: 0, key: 'tooManyFiles' }])
      return
    }
    previewFile(files[0])
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileChange(e.dataTransfer.files)
  }

  const handleDownloadTemplate = async () => {
    setIsDownloading(true)
    await callServerFunction(() => getImportEmissionFactorsTemplateUrl(), {
      onSuccess: (url) => downloadFromUrl(url, t('templateFileName')),
    })
    setIsDownloading(false)
  }

  return (
    <Modal
      open={open}
      label="import-emission-factors"
      title={t('title')}
      onClose={handleClose}
      big={modalState === 'preview'}
      actions={
        modalState === 'preview'
          ? [
              {
                actionType: 'button',
                onClick: reset,
                children: tCommon('action.back'),
              },
              {
                actionType: 'loadingButton',
                onClick: confirmImport,
                loading: isPending,
                children: t('confirm'),
              },
            ]
          : undefined
      }
    >
      <div className="flex-col gapped15">
        {modalState !== 'preview' && (
          <div className="flex align-center">
            <LoadingButton
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              loading={isDownloading}
            >
              {t('downloadTemplate')}
            </LoadingButton>
          </div>
        )}

        {modalState === 'preview' && (
          <>
            <Typography variant="body2" color="textSecondary">
              {t('previewTitle', { count: previewRows.length })} — {t('previewWarning')}
            </Typography>
            <div className={styles.tableWrapper}>
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
                  {previewRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className={styles.cellName}>{row.name}</TableCell>
                      <TableCell>{row.source}</TableCell>
                      <TableCell>{row.unit}</TableCell>
                      <TableCell align="right">{row.totalCo2}</TableCell>
                      <TableCell>{row.postsAndSubPosts}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {(modalState === 'default' || modalState === 'error') && (
          <>
            <div
              className={classNames(styles.dropzone, 'flex-col align-center justify-center gapped075')}
              onClick={() => !isPending && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !isPending && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e.target.files)}
              />
              {isPending ? (
                <CircularProgress size={32} />
              ) : (
                <>
                  <UploadFileIcon className={styles.icon} />
                  <Typography variant="body1">{isDragOver ? t('dropzoneActive') : t('dropzone')}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {t('acceptedFormats')}
                  </Typography>
                </>
              )}
            </div>

            {modalState === 'error' && errors.length > 0 && (
              <Alert severity="error">
                <AlertTitle>{t('errorTitle')}</AlertTitle>
                <List dense className={styles.errorList}>
                  {errors.map((err, i) => (
                    <ListItem key={i} disableGutters className="py025">
                      <Typography variant="body2">
                        {err.line > 0 ? `${tCommon('label.line', { line: err.line })} : ` : ''}
                        {t(err.key as Parameters<typeof t>[0], err.value ? { value: err.value } : undefined)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}

export default ImportEmissionFactorsModal
