'use client'

import { getUserCheckedItems } from '@/services/serverFunctions/user'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Drawer, IconButton } from '@mui/material'
import { Organization, Role, UserChecklist } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistDrawer from './ChecklistDrawer'

interface Props {
  userOrganization: Organization
  clientId?: string
  studyId?: string
  userRole: Role
}

const ChecklistButton = ({ userOrganization, clientId, studyId, userRole }: Props) => {
  const t = useTranslations('checklist')
  const [open, setOpen] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [checklist, setChecklist] = useState<UserChecklist[]>([])
  const [previousPath, setPreviousPath] = useState('/')
  const [fetchedCheckedSteps, setFetchedCheckedSteps] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    if (searchParams.get('fromLogin') !== null) {
      setOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    setPreviousPath(pathname)
    if (pathname !== previousPath) {
      setOpen(false)
    }
  }, [pathname])

  useEffect(() => {
    getCheckList()
  }, [open])

  const getCheckList = async () => {
    const checkList = await getUserCheckedItems()
    setFetchedCheckedSteps(true)
    if (checkList.some((item) => item.step === UserChecklist.Completed)) {
      setCompleted(true)
    } else {
      setChecklist(checkList.map((item) => item.step))
    }
  }

  if (completed || !fetchedCheckedSteps) {
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
          userRole={userRole}
          userOrganization={userOrganization}
          clientId={clientId}
          studyId={studyId}
        />
      </Drawer>
    </div>
  )
}

export default ChecklistButton
