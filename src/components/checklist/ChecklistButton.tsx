import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Button } from '@mui/material'
import { Organization, UserCheckedStep } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistModal from './ChecklistModal'

interface Props {
  userChecklist: UserCheckedStep[]
  userOrganization: Organization
  organizations: Organization[]
  studyId?: string
}

const ChecklistButton = ({ userChecklist, userOrganization, organizations, studyId }: Props) => {
  const t = useTranslations('checklist')
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(!open)} title={t('title')} aria-label={t('title')}>
        <CheckCircleOutlineIcon className={styles.button} />
      </Button>
      <ChecklistModal
        open={open}
        setOpen={setOpen}
        userChecklist={userChecklist}
        userOrganization={userOrganization}
        organizations={organizations}
        studyId={studyId}
      />
    </>
  )
}

export default ChecklistButton
