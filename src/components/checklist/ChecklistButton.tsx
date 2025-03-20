'use client'

import { getUserCheckedItems } from '@/services/serverFunctions/user'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Drawer, IconButton } from '@mui/material'
import { Organization, UserChecklist } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistDrawer from './ChecklistDrawer'

interface Props {
  userOrganization: Organization
  clientId?: string
  studyId?: string
}

const ChecklistButton = ({ userOrganization, clientId, studyId }: Props) => {
  const t = useTranslations('checklist')
  const [open, setOpen] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [checklist, setChecklist] = useState<UserChecklist[]>([])

  useEffect(() => {
    getCheckList()
  }, [open])

  const getCheckList = async () => {
    const checkList = await getUserCheckedItems()
    if (checkList.some((item) => item.step === UserChecklist.Completed)) {
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
          clientId={clientId}
          studyId={studyId}
        />
      </Drawer>
    </div>
  )
}

export default ChecklistButton
