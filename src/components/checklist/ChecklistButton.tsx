'use client'

import { getUserChecklist } from '@/services/serverFunctions/user'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Drawer, IconButton } from '@mui/material'
import { CRUserChecklist, Organization, UserCheckedStep } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistDrawer from './ChecklistDrawer'

interface Props {
  userChecklist: UserCheckedStep[]
  userOrganization: Organization
  organizations: Organization[]
  studyId?: string
}

const ChecklistButton = ({ userOrganization, organizations, studyId, userChecklist }: Props) => {
  const t = useTranslations('checklist')
  const [open, setOpen] = useState(false)
  const [checklist, setChecklist] = useState<CRUserChecklist[]>(userChecklist.map((item) => item.step))

  useEffect(() => {
    if (open) {
      getCheckList()
    }
  }, [open])

  useEffect(() => {
    setChecklist(userChecklist.map((item) => item.step))
  }, [userChecklist])

  const getCheckList = async () => {
    const checkList = await getUserChecklist()
    setChecklist(checkList.map((item) => item.step))
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
          open={open}
          setOpen={setOpen}
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
