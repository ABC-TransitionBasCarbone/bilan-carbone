'use client'

import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/modals/Modal'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Alert, AlertTitle, CircularProgress, List, ListItem, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { DragEvent, ReactNode, useRef, useState, useTransition } from 'react'
import styles from './ImportFileModal.module.css'

export type ImportError = { line: number; key: string; value?: string }
export type ImportModalState = 'default' | 'preview' | 'error'

interface Props<TPreviewRow> {
  open: boolean
  label: string
  title: string
  onClose: () => void
  onSuccess: () => void
  onPreview: (file: File) => Promise<{ success: true; rows: TPreviewRow[] } | { success: false; errors: ImportError[] }>
  onConfirmImport: (file: File) => Promise<{ success: true } | { success: false; errors: ImportError[] }>
  onDownloadTemplate: () => Promise<void>
  renderPreviewTable: (rows: TPreviewRow[]) => ReactNode
  previewTitle: (count: number) => string
  acceptedFormats?: string
}

const ImportFileModal = <TPreviewRow,>({
  open,
  label,
  title,
  onClose,
  onSuccess,
  onPreview,
  onConfirmImport,
  onDownloadTemplate,
  renderPreviewTable,
  previewTitle,
  acceptedFormats,
}: Props<TPreviewRow>) => {
  const t = useTranslations('importFileModal')
  const tCommon = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [isDownloading, setIsDownloading] = useState(false)
  const [modalState, setModalState] = useState<ImportModalState>('default')
  const [errors, setErrors] = useState<ImportError[]>([])
  const [previewRows, setPreviewRows] = useState<TPreviewRow[]>([])
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
      const result = await onPreview(file)
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
      const result = await onConfirmImport(pendingFile)
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
    try {
      await onDownloadTemplate()
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Modal
      open={open}
      label={label}
      title={title}
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
                children: tCommon('action.confirm'),
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
              {previewTitle(previewRows.length)} — {t('previewWarning')}
            </Typography>
            <div className={styles.tableWrapper}>{renderPreviewTable(previewRows)}</div>
          </>
        )}

        {(modalState === 'default' || modalState === 'error') && (
          <>
            <div
              className={classNames(styles.dropzone, 'flex-col align-center justify-center gapped075 pointer')}
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
                    {acceptedFormats ?? t('acceptedFormats')}
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
                        {t(err.key, err.value ? { value: err.value } : undefined)}
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

export default ImportFileModal
