'use client'

import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { Drawer, Fab } from '@mui/material'
import { Environment, StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import DrawerPaper from './DrawerPaper'
import StudyDrawer from './StudyDrawer'
import styles from './StudyNavbar.module.css'

interface Props {
  environment: Environment
  studyId: UUID
  studyName: string
  studySimplified: boolean
  isTransitionPlanActive: boolean
  hasObjectives: boolean
  userRole: StudyRole | null
}

const StudyNavbar = ({
  environment,
  studyId,
  studyName,
  studySimplified,
  isTransitionPlanActive,
  hasObjectives,
  userRole,
}: Props) => {
  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState(true)

  return (
    <>
      <div className={styles.toggleButtonContainer}>
        <Fab
          color="primary"
          size="medium"
          data-testid="study-navbar-button"
          className={styles.toggleButton}
          aria-label={t('menu')}
          title={t('menu')}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <MenuOpenIcon /> : <MenuIcon />}
        </Fab>
      </div>
      <Drawer
        className={open ? styles.opened : ''}
        open={open}
        slots={{ paper: DrawerPaper }}
        slotProps={{
          paper: {
            className: classNames('ml1 hauto', styles.drawerContainer),
          },
        }}
        variant="persistent"
        transitionDuration={0}
      >
        <StudyDrawer
          studyId={studyId}
          studyName={studyName}
          studySimplified={studySimplified}
          userRole={userRole}
          environment={environment}
          isTransitionPlanActive={isTransitionPlanActive}
          hasObjectives={hasObjectives}
        />
      </Drawer>
    </>
  )
}

export default StudyNavbar
