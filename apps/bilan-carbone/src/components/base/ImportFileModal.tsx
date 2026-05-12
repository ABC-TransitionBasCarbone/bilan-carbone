'use client'

import LoadingButton from '@/components/base/LoadingButton'
import Modal from '@/components/modals/Modal'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DownloadIcon from '@mui/icons-material/Download'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { Alert, AlertTitle, CircularProgress, List, ListItem, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { DragEvent, ReactNode, useRef, useState, useTransition } from 'react'
import styles from './ImportFileModal.module.css'

type ImportError = { line: number; key: string; value?: string }

type ImportWarningCandidate = { foundTitle?: string; foundValue?: number; foundUnit?: string }

type ImportWarning = {
  type: 'efNotFound' | 'validationSkipped'
  line: number
  sourceName?: string
  searchedName?: string
  searchedValue?: number
  searchedUnit?: string
  foundTitle?: string
  foundValue?: number
  foundUnit?: string
  candidates?: ImportWarningCandidate[]
}

type ImportResult = { success: boolean; errors?: ImportError[]; warnings?: ImportWarning[] }

type ImportModalState = 'default' | 'preview' | 'error' | 'warning'

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
  const [modalState, setModalState] = useState<ImportModalState>('default')
  const [errors, setErrors] = useState<ImportError[]>([])
  const [warnings, setWarnings] = useState<ImportWarning[]>([])
  const [previewRows, setPreviewRows] = useState<TPreviewRow[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setModalState('default')
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
      } else if (result.warnings) {
        setModalState('warning')
        setWarnings(result.warnings)
      } else {
        setModalState('error')
        setErrors(result.errors ?? [])
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
        setModalState('error')
        setErrors(result.errors ?? [])
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
              { actionType: 'button', variant: 'outlined', onClick: reset, children: tCommon('action.back') },
              {
                actionType: 'loadingButton',
                onClick: confirmImport,
                loading: isPending,
                children: tCommon('action.confirm'),
              },
            ]
          : modalState === 'warning' && onForceImport
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

        {modalState === 'warning' && warnings.length > 0 && (
          <Alert severity="warning">
            <AlertTitle>{t('warningTitle')}</AlertTitle>
            <List dense className={styles.errorList}>
              {groupByLine(warnings).map(({ line, items }) => (
                <ListItem key={line} disableGutters className="py025">
                  <div>
                    {line > 0 && (
                      <Typography variant="body2" fontWeight="medium">
                        {tCommon('label.line', { line })}
                        {items[0]?.sourceName ? ` — ${items[0].sourceName}` : ''}
                      </Typography>
                    )}
                    <List dense disablePadding>
                      {items.map((w, i) => {
                        if (w.type === 'validationSkipped') {
                          return (
                            <ListItem key={i} disableGutters className={line > 0 ? 'pl15' : undefined}>
                              <Typography variant="body2">
                                {line > 0 ? '• ' : ''}
                                {t('warningValidationSkipped')}
                              </Typography>
                            </ListItem>
                          )
                        }
                        const formatEf = (
                          name: string | undefined,
                          value: number | undefined,
                          unit: string | undefined,
                        ) =>
                          [name, value !== undefined && unit ? `${value} ${unit}` : (value ?? unit)]
                            .filter(Boolean)
                            .join(' - ')
                        const searched = formatEf(w.searchedName, w.searchedValue, w.searchedUnit)
                        const found =
                          w.foundTitle !== undefined || w.foundValue !== undefined
                            ? formatEf(w.foundTitle, w.foundValue, w.foundUnit)
                            : null
                        return (
                          <ListItem key={i} disableGutters className={line > 0 ? 'pl15' : undefined}>
                            <div>
                              <Typography variant="body2">
                                {line > 0 ? '• ' : ''}
                                {t('warningEfNotFound', { searched })}
                              </Typography>
                              {w.candidates ? (
                                <>
                                  <Typography variant="body2" className="align-center gapped025">
                                    {t('warningEfAmbiguous')}
                                  </Typography>
                                  {w.candidates.map((c, j) => (
                                    <Typography key={j} variant="body2" className="align-center gapped025">
                                      {'  – '}
                                      {formatEf(c.foundTitle, c.foundValue, c.foundUnit)}
                                    </Typography>
                                  ))}
                                  <Typography variant="body2" fontWeight="bold" className="align-center gapped025">
                                    <ArrowForwardIcon className={styles.warningArrow} />
                                    {t('warningEfLeftEmpty')}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="body2" fontWeight="bold" className="align-center gapped025">
                                  <ArrowForwardIcon className={styles.warningArrow} />
                                  {found ? `${t('warningEfReplacedBy')} ${found}` : t('warningEfLeftEmpty')}
                                </Typography>
                              )}
                            </div>
                          </ListItem>
                        )
                      })}
                    </List>
                  </div>
                </ListItem>
              ))}
            </List>
          </Alert>
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
                  {groupByLine(errors).map(({ line, items }) => (
                    <ListItem key={line} disableGutters className="py025">
                      <div>
                        {line > 0 && (
                          <Typography variant="body2" fontWeight="medium">
                            {tCommon('label.line', { line })}
                          </Typography>
                        )}
                        <List dense disablePadding>
                          {items.map((msg, i) => (
                            <ListItem key={i} disableGutters className={line > 0 ? 'pl15' : undefined}>
                              <Typography variant="body2">
                                {line > 0 ? '• ' : ''}
                                {t(msg.key, msg.value !== undefined ? { value: msg.value } : undefined)}
                              </Typography>
                            </ListItem>
                          ))}
                        </List>
                      </div>
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
