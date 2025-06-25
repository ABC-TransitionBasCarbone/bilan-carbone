'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { getUserCheckList } from '@/services/checklist'
import { getUserCheckedItems } from '@/services/serverFunctions/user'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Drawer, Fab } from '@mui/material'
import { Level, OrganizationVersion, Role, UserChecklist } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './Checklist.module.css'
import ChecklistDrawer from './ChecklistDrawer'

interface Props {
  accountOrganizationVersion: OrganizationVersion
  clientId?: string
  studyId?: string
  userRole: Role
  userLevel: Level | null
}

const ChecklistButton = ({ accountOrganizationVersion, clientId, studyId, userRole, userLevel }: Props) => {
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

  const hideChecklist = useMemo(() => {
    if (completed || !fetchedCheckedSteps) {
      return true
    }

    const availableChecklist = getUserCheckList(userRole, accountOrganizationVersion.isCR, userLevel)
    const remainingChecklist = availableChecklist.filter(
      (step) => step !== UserChecklist.CreateAccount && step !== UserChecklist.Completed,
    )

    return remainingChecklist.length === 0
  }, [completed, fetchedCheckedSteps, userRole, accountOrganizationVersion.isCR, userLevel])

  if (hideChecklist) {
    return null
  }

  return (
    <div className={styles.checklistButton}>
      <Fab
        color="primary"
        data-testid="checklist-button"
        aria-label={t('title')}
        title={t('title')}
        onClick={() => setOpen(!open)}
      >
        <CheckCircleOutlineIcon />
      </Fab>
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
          userLevel={userLevel}
          accountOrganizationVersion={accountOrganizationVersion}
          clientId={clientId}
          studyId={studyId}
        />
      </Drawer>
    </div>
  )
}

export default ChecklistButton
