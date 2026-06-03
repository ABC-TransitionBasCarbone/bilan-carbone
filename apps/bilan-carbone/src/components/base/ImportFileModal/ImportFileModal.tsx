'use client'

import Modal from '@/components/modals/Modal'
import { AmbiguousRow, FEChoices, ImportError, ImportResult, ImportWarning } from '@/types/import.types'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { CircularProgress, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { DragEvent, ReactNode, useRef, useState, useTransition } from 'react'
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
  onPreview: (
    file: File,
    choices?: FEChoices,
  ) => Promise<
    | { success: true; rows: TPreviewRow[] }
    | { success: false; errors: ImportError[] }
    | { success: 'warnings'; warnings: ImportWarning[]; ambiguousRows: AmbiguousRow[] }
    | { success: 'ambiguous'; rows: AmbiguousRow[] }
  >
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
    const initial: FEChoices = {}
    for (const row of rows) {
      if (!(row.lineNumber in feChoices)) {
        initial[row.lineNumber] = null
      }
    }
    setFeChoices((prev) => ({ ...prev, ...initial }))
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
      const result = await onPreview(file)
      if (result.success === true) {
        setPreviewRows(result.rows)
      } else if (result.success === 'warnings') {
        setWarnings(groupByLine(result.warnings))
        setPendingAmbiguousRows(result.ambiguousRows)
      } else if (result.success === 'ambiguous') {
        initAmbiguousRows(result.rows)
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
    startTransition(async () => {
      const result = await onPreview(pendingFile, feChoices)
      if (result.success === true) {
        setWarnings([])
        setPreviewRows(result.rows)
      } else if (result.success === 'ambiguous') {
        setWarnings([])
        initAmbiguousRows(result.rows)
      } else if (result.success === 'warnings') {
        setWarnings(groupByLine(result.warnings))
        setPendingAmbiguousRows(result.ambiguousRows)
      } else {
        setWarnings([])
        setErrors(groupByLine(result.errors))
      }
    })
  }

  const handleResolveAmbiguities = () => {
    if (!pendingFile) {
      return
    }
    startTransition(async () => {
      const result = await onPreview(pendingFile, feChoices)
      if (result.success === true) {
        setAmbiguousRows([])
        setPreviewRows(result.rows)
      } else if (result.success === 'ambiguous') {
        initAmbiguousRows(result.rows)
      } else if (result.success === 'warnings') {
        setAmbiguousRows([])
        setWarnings(groupByLine(result.warnings))
        setPendingAmbiguousRows(result.ambiguousRows)
      } else {
        setAmbiguousRows([])
        setErrors(groupByLine(result.errors))
      }
    })
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
          <div className={styles.ambiguousWrapper}>
            <Typography variant="body2" color="textSecondary">
              {t('ambiguousTitle')}
            </Typography>
            {ambiguousRows.map((row) => (
              <div key={row.lineNumber} className={styles.ambiguousRow}>
                <Typography variant="body2" fontWeight="medium">
                  {tCommon('label.line', { line: row.lineNumber })}
                  {row.sourceName ? ` — ${row.sourceName}` : ''}
                </Typography>
                {row.searchedName && (
                  <Typography variant="caption" color="textSecondary">
                    {t('ambiguousSearched', { name: row.searchedName })}
                  </Typography>
                )}
                {row.tooMany ? (
                  <Typography variant="body2">{t('ambiguousTooMany')}</Typography>
                ) : (
                  <RadioGroup
                    className={styles.ambiguousRadioGroup}
                    value={feChoices[row.lineNumber] ?? 'null'}
                    onChange={(e) =>
                      setFeChoices((prev) => ({
                        ...prev,
                        [row.lineNumber]: e.target.value === 'null' ? null : e.target.value,
                      }))
                    }
                  >
                    {row.candidates.map((c) => (
                      <FormControlLabel
                        key={c.id}
                        value={c.id}
                        control={<Radio size="small" />}
                        label={
                          <Typography variant="body2">
                            {[c.foundTitle, c.foundValue !== undefined ? `${c.foundValue}` : undefined, c.foundUnit]
                              .filter(Boolean)
                              .join(' · ')}
                          </Typography>
                        }
                      />
                    ))}
                    <FormControlLabel
                      value="null"
                      control={<Radio size="small" />}
                      label={
                        <Typography variant="body2" color="textSecondary">
                          {t('leaveEmpty')}
                        </Typography>
                      }
                    />
                  </RadioGroup>
                )}
              </div>
            ))}
          </div>
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
