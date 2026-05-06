'use client'

import { exportManualEmissionFactorsToFile } from '@/services/serverFunctions/importEmissionFactors'
import { useToast } from '@abc-transitionbascarbone/ui'
import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import Button from '@mui/material/Button'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useState, useTransition } from 'react'
import styles from './EmissionFactorButtons.module.css'

const ImportEmissionFactorsModal = dynamic(() => import('./ImportEmissionFactorsModal'))

const EmissionFactorButtons = () => {
  const t = useTranslations('emissionFactors')
  const tCommon = useTranslations('common.action')
  const { showSuccessToast } = useToast()
  const [open, setOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null)
  const [isExporting, startExportTransition] = useTransition()

  const handleClose = () => setOpen(false)

  const handleSuccess = () => {
    handleClose()
    showSuccessToast(t('importModal.success'))
  }

  const handleExport = () => {
    setMenuAnchor(null)
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
      <Button
        data-testid="emission-factors-menu"
        className={styles.trigger}
        variant="outlined"
        endIcon={<ArrowDropDownIcon />}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
      >
        {t('manualSectionLabel')}
      </Button>
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { style: { width: menuAnchor?.offsetWidth } } }}
      >
        <MenuItem
          className={styles.menuItem}
          onClick={() => {
            setMenuAnchor(null)
            setOpen(true)
          }}
        >
          <ListItemIcon>
            <UploadFileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{tCommon('import')}</ListItemText>
        </MenuItem>
        <MenuItem className={styles.menuItem} onClick={handleExport} disabled={isExporting}>
          <ListItemIcon>
            <FileDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{tCommon('export')}</ListItemText>
        </MenuItem>
        <MenuItem
          className={styles.menuItem}
          component="a"
          href="/facteurs-d-emission/creer"
          data-testid="new-emission"
          onClick={() => setMenuAnchor(null)}
        >
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{tCommon('add')}</ListItemText>
        </MenuItem>
      </Menu>
      {open && <ImportEmissionFactorsModal open={open} onClose={handleClose} onSuccess={handleSuccess} />}
    </>
  )
}

export default EmissionFactorButtons
