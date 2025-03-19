'use client'

import { getUserCheckedItems } from '@/services/serverFunctions/user'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Drawer, IconButton } from '@mui/material'
import { CRUserChecklist, Organization } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistDrawer from './ChecklistDrawer'

interface Props {
  userOrganization: Organization
  organizations: Organization[]
  studyId?: string
}

const ChecklistButton = ({ userOrganization, organizations, studyId }: Props) => {
  const t = useTranslations('checklist')
  const [open, setOpen] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [checklist, setChecklist] = useState<CRUserChecklist[]>([])

  useEffect(() => {
    getCheckList()
  }, [open])

  const getCheckList = async () => {
    const checkList = await getUserCheckedItems()
    if (checkList.some((item) => item.step === CRUserChecklist.Completed)) {
      setCompleted(true)
    } else {
      setChecklist(checkList.map((item) => item.step))
    }
  }

  if (completed) {
    return null
  }

  return (
    <div className={styles.checklistButton}>
      <IconButton
        data-testid="checklist-button"
        className={styles.openDrawerButton}
        aria-label={t('title')}
        title={t('title')}
        onClick={() => setOpen(!open)}
      >
        <CheckCircleOutlineIcon />
      </IconButton>
      <Drawer
        open={open}
        anchor="right"
        PaperProps={{ className: classNames(styles.checklistContainer, styles.drawer) }}
        SlideProps={{ direction: 'left' }}
        variant="persistent"
      >
        <ChecklistDrawer
          setOpen={setOpen}
          getCheckList={getCheckList}
          userChecklist={checklist}
          userOrganization={userOrganization}
          organizations={organizations}
          studyId={studyId}
        />
      </Drawer>
    </div>
  )
}

export default ChecklistButton
