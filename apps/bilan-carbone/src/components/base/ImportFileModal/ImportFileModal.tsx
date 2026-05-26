'use client'

import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/modals/Modal'
import { ImportError, ImportResult, ImportWarning } from '@/types/import.types'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { CircularProgress, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { DragEvent, ReactNode, useRef, useState, useTransition } from 'react'
import ErrorList from './ErrorList'
import styles from './ImportFileModal.module.css'
import WarningList from './WarningList'

function groupByLine<T extends { line: number }>(items: T[]): { line: number; items: T[] }[] {
  const map = new Map<number, T[]>()
  for (const item of items) {
    const existing = map.get(item.line)
    if (existing) {
      existing.push(item)
    } else {
      map.set(item.line, [item])
    }
  }
  return Array.from(map.entries()).map(([line, items]) => ({ line, items }))
}

interface Props<TPreviewRow> {
  open: boolean
  label: string
  title: string
  onClose: () => void
  onSuccess: () => void
  onPreview: (file: File) => Promise<{ success: true; rows: TPreviewRow[] } | { success: false; errors: ImportError[] }>
  onConfirmImport: (file: File) => Promise<ImportResult>
  onForceImport?: (file: File) => Promise<ImportResult>
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
  onForceImport,
  onDownloadTemplate,
  renderPreviewTable,
  previewTitle,
  acceptedFormats,
}: Props<TPreviewRow>) => {
  const t = useTranslations('importFileModal')
  const tCommon = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [isDownloading, setIsDownloading] = useState(false)
  const [errors, setErrors] = useState<{ line: number; items: ImportError[] }[]>([])
  const [warnings, setWarnings] = useState<{ line: number; items: ImportWarning[] }[]>([])
  const [previewRows, setPreviewRows] = useState<TPreviewRow[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPreview = previewRows.length > 0
  const isWarning = warnings.length > 0
  const isError = errors.length > 0

  const reset = () => {
    setErrors([])
    setWarnings([])
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
    setPreviewRows([])
    setPendingFile(file)
    startTransition(async () => {
      const result = await onPreview(file)
      if (result.success) {
        setPreviewRows(result.rows)
      } else {
        setErrors(groupByLine(result.errors))
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
      } else if (result.warnings) {
        setPreviewRows([])
        setWarnings(groupByLine(result.warnings))
      } else {
        setErrors(groupByLine(result.errors ?? []))
      }
    })
  }

  const forceImport = () => {
    if (!pendingFile || !onForceImport) {
      return
    }
    startTransition(async () => {
      const result = await onForceImport(pendingFile)
      if (result.success) {
        reset()
        onSuccess()
      } else {
        setWarnings([])
        setErrors(groupByLine(result.errors ?? []))
      }
    })
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files?.length) {
      return
    }
    if (files.length > 1) {
      setErrors(groupByLine([{ line: 0, key: 'tooManyFiles' }]))
      return
    }
    const file = files[0]
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    previewFile(file)
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
      big={isPreview}
      actions={
        isPreview
          ? [
              { actionType: 'button', variant: 'outlined', onClick: reset, children: tCommon('action.back') },
              {
                actionType: 'loadingButton',
                onClick: confirmImport,
                loading: isPending,
                children: tCommon('action.confirm'),
              },
            ]
          : isWarning && onForceImport
            ? [
                {
                  actionType: 'button',
                  variant: 'outlined',
                  color: 'error',
                  onClick: reset,
                  children: tCommon('action.cancel'),
                },
                {
                  actionType: 'loadingButton',
                  onClick: forceImport,
                  loading: isPending,
                  children: t('confirmAnyway'),
                },
              ]
            : undefined
      }
    >
      <div className={classNames('flex-col gapped15', { 'grow overflow-hidden': isPreview && !isWarning })}>
        {!isPreview && (
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

        {isPreview && !isWarning && (
          <>
            <Typography variant="body2" color="textSecondary">
              {previewTitle(previewRows.length)} — {t('previewWarning')}
            </Typography>
            <div className={styles.tableWrapper}>{renderPreviewTable(previewRows)}</div>
          </>
        )}

        {isWarning && <WarningList warnings={warnings} t={t} tCommon={tCommon} />}

        {!isPreview && !isWarning && (
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

            {isError && <ErrorList errors={errors} t={t} tCommon={tCommon} />}
          </>
        )}
      </div>
    </Modal>
  )
}

export default ImportFileModal
