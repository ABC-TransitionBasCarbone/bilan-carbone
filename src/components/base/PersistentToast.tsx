'use client'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import { IconButton, Portal, Slide, Typography } from '@mui/material'
import classNames from 'classnames'
import { ReactNode, useState } from 'react'
import styles from './PersistentToast.module.css'

interface Props {
  title: string
  subtitle?: ReactNode
  onClose?: () => void
  icon?: ReactNode
}

const PersistentToast = ({ title, subtitle, onClose, icon }: Props) => {
  const [open, setOpen] = useState(true)

  const handleClose = () => {
    setOpen(false)
    onClose?.()
  }

  return (
    <Portal>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <div className={classNames(styles.toast, 'flex align-center justify-between')}>
          <div className="flex align-center gapped1">
            {icon || <CheckCircleIcon className={styles.icon} />}
            <div className="flex-col">
              <Typography fontWeight={'bold'}>{title}</Typography>
              {subtitle && <Typography className={styles.subtitle}>{subtitle}</Typography>}
            </div>
          </div>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </div>
      </Slide>
    </Portal>
  )
}

export default PersistentToast
