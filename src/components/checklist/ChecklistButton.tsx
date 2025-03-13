'use client'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Drawer, IconButton } from '@mui/material'
import { Organization, UserCheckedStep } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistDrawer from './ChecklistDrawer'

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
          userChecklist={userChecklist}
          userOrganization={userOrganization}
          organizations={organizations}
          studyId={studyId}
        />
      </Drawer>
    </div>
  )
}

export default ChecklistButton
