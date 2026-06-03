'use client'

import Modal from '@/components/modals/Modal'
import { AmbiguousRow, FEChoices, ImportError, ImportResult, ImportWarning } from '@/types/import.types'
import { ValidateEmissionSourcesResult } from '@/types/importEmissionSources.types'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { CircularProgress, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { DragEvent, ReactNode, useRef, useState, useTransition } from 'react'
import AmbiguousEmissionFactorList from './AmbiguousEmissionFactorList'
import ErrorList from './ErrorList'
import styles from './ImportFileModal.module.css'
import WarningList from './WarningList'

function groupByLine<T extends { lineNumber: number | null }>(items: T[]): { lineNumber: number | null; items: T[] }[] {
  const map = new Map<number | null, T[]>()
  for (const item of items) {
    const existing = map.get(item.lineNumber)
    if (existing) {
      existing.push(item)
    } else {
      map.set(item.lineNumber, [item])
    }
  }
  return Array.from(map.entries()).map(([lineNumber, items]) => ({ lineNumber, items }))
}

interface Props<TPreviewRow> {
  open: boolean
  label: string
  title: string
  onClose: () => void
  onSuccess: () => void
  onValidate: (file: File) => Promise<ValidateEmissionSourcesResult>
  onResolve?: (
    file: File,
    choices: FEChoices,
  ) => Promise<{ status: 'error'; errors: ImportError[] } | { status: 'ok'; rows: TPreviewRow[] }>
  onConfirmImport: (file: File, choices?: FEChoices) => Promise<ImportResult>
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
  onValidate,
  onResolve,
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
  const [errors, setErrors] = useState<{ lineNumber: number | null; items: ImportError[] }[]>([])
  const [warnings, setWarnings] = useState<{ lineNumber: number | null; items: ImportWarning[] }[]>([])
  const [pendingAmbiguousRows, setPendingAmbiguousRows] = useState<AmbiguousRow[]>([])
  const [ambiguousRows, setAmbiguousRows] = useState<AmbiguousRow[]>([])
  const [feChoices, setFeChoices] = useState<FEChoices>({})
  const [previewRows, setPreviewRows] = useState<TPreviewRow[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isPreview = previewRows.length > 0
  const isWarning = warnings.length > 0
  const isAmbiguous = ambiguousRows.length > 0
  const isError = errors.length > 0

  const reset = () => {
    setErrors([])
    setWarnings([])
    setPendingAmbiguousRows([])
    setAmbiguousRows([])
    setFeChoices({})
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

  const initAmbiguousRows = (rows: AmbiguousRow[]) => {
    setAmbiguousRows(rows)
  }

  const previewFile = (file: File) => {
    setErrors([])
    setWarnings([])
    setPendingAmbiguousRows([])
    setAmbiguousRows([])
    setFeChoices({})
    setPreviewRows([])
    setPendingFile(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    startTransition(async () => {
      const result = await onValidate(file)
      if (result.status === 'ok') {
        if (onResolve) {
          const resolved = await onResolve(file, {})
          if (resolved.status === 'ok') {
            setPreviewRows(resolved.rows)
          } else {
            setErrors(groupByLine(resolved.errors))
          }
        }
      } else if (result.status === 'warnings') {
        setWarnings(groupByLine(result.warnings))
        setPendingAmbiguousRows(result.ambiguousRows)
      } else if (result.status === 'ambiguous') {
        initAmbiguousRows(result.rows)
      } else {
        setErrors(groupByLine(result.errors))
      }
    })
  }

  const resolveAndPreview = (file: File, choices: FEChoices, onDone: () => void) => {
    if (!onResolve) {
      return
    }
    startTransition(async () => {
      const result = await onResolve(file, choices)
      onDone()
      if (result.status === 'ok') {
        setPreviewRows(result.rows)
      } else {
        setErrors(groupByLine(result.errors))
      }
    })
  }

  const handleContinueFromWarnings = () => {
    if (!pendingFile) {
      return
    }
    if (pendingAmbiguousRows.length > 0) {
      setWarnings([])
      initAmbiguousRows(pendingAmbiguousRows)
      setPendingAmbiguousRows([])
      return
    }
    resolveAndPreview(pendingFile, feChoices, () => setWarnings([]))
  }

  const handleResolveAmbiguities = () => {
    if (!pendingFile) {
      return
    }
    resolveAndPreview(pendingFile, feChoices, () => setAmbiguousRows([]))
  }

  const confirmImport = () => {
    if (!pendingFile) {
      return
    }
    startTransition(async () => {
      const result = await onConfirmImport(pendingFile, feChoices)
      if (result.success) {
        reset()
        onSuccess()
      } else {
        setErrors(groupByLine(result.errors ?? []))
      }
    })
  }

  const handleFileChange = (files: FileList | null) => {
    if (!files?.length) {
      return
    }
    if (files.length > 1) {
      setErrors(groupByLine([{ lineNumber: null, key: 'tooManyFiles' }]))
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
          : isAmbiguous
            ? [
                { actionType: 'button', variant: 'outlined', onClick: reset, children: tCommon('action.back') },
                {
                  actionType: 'loadingButton',
                  onClick: handleResolveAmbiguities,
                  loading: isPending,
                  children: tCommon('action.continue'),
                },
              ]
            : isWarning
              ? [
                  { actionType: 'button', variant: 'outlined', onClick: reset, children: tCommon('action.cancel') },
                  {
                    actionType: 'loadingButton',
                    onClick: handleContinueFromWarnings,
                    loading: isPending,
                    children: t('confirmAnyway'),
                  },
                ]
              : undefined
      }
    >
      <div className={classNames('flex-col gapped15', { 'grow overflow-hidden': isPreview })}>
        {!isPreview && !isWarning && !isAmbiguous && (
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

        {isWarning && <WarningList warnings={warnings} t={t} tCommon={tCommon} />}

        {isAmbiguous && (
          <AmbiguousEmissionFactorList
            rows={ambiguousRows}
            choices={feChoices}
            onChange={(lineNumber, value) => setFeChoices((prev) => ({ ...prev, [lineNumber]: value }))}
          />
        )}

        {isPreview && (
          <>
            <Typography variant="body2" color="textSecondary">
              {previewTitle(previewRows.length)} — {t('previewWarning')}
            </Typography>
            <div className={styles.tableWrapper}>{renderPreviewTable(previewRows)}</div>
          </>
        )}

        {!isPreview && !isWarning && !isAmbiguous && (
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
