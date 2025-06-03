'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { getUserCheckedItems } from '@/services/serverFunctions/user'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Drawer, IconButton } from '@mui/material'
import { OrganizationVersion, Role, UserChecklist } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistDrawer from './ChecklistDrawer'

interface Props {
  accountOrganizationVersion: OrganizationVersion
  clientId?: string
  studyId?: string
  userRole: Role
}

const ChecklistButton = ({ accountOrganizationVersion, clientId, studyId, userRole }: Props) => {
  const t = useTranslations('checklist')
  const { callServerFunction } = useServerFunction()
  const [open, setOpen] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [checklist, setChecklist] = useState<UserChecklist[]>([])
  const [previousPath, setPreviousPath] = useState('/')
  const [fetchedCheckedSteps, setFetchedCheckedSteps] = useState(false)
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const getCheckList = useCallback(async () => {
    await callServerFunction(() => getUserCheckedItems(), {
      onSuccess: (checkList) => {
        setFetchedCheckedSteps(true)
        if (checkList.some((item) => item.step === UserChecklist.Completed)) {
          setCompleted(true)
        } else {
          setChecklist(checkList.map((item) => item.step))
        }
      },
    })
  }, [callServerFunction])

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
  }, [pathname, previousPath])

  useEffect(() => {
    getCheckList()
  }, [open, getCheckList])

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
          accountOrganizationVersion={accountOrganizationVersion}
          clientId={clientId}
          studyId={studyId}
        />
      </Drawer>
    </div>
  )
}

export default ChecklistButton
