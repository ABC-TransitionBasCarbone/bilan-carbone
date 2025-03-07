import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Button } from '@mui/material'
import { CRUserChecklist, UserCheckedStep } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistModal from './ChecklistModal'

interface Props {
  isCR: boolean
  userChecklist: UserCheckedStep[]
}

const ChecklistButton = ({ isCR, userChecklist }: Props) => {
  const t = useTranslations('checklist')
  const [open, setOpen] = useState(false)
  const steps = isCR ? CRUserChecklist : CRUserChecklist

  return (
    <>
      <Button onClick={() => setOpen(!open)} title={t('title')} aria-label={t('title')}>
        <CheckCircleOutlineIcon className={styles.button} />
      </Button>
      <ChecklistModal open={open} setOpen={setOpen} steps={steps} userChecklist={userChecklist} />
    </>
  )
}

export default ChecklistButton
