'use client'

import StudyName from '@/components/study/card/StudyName'
import { getStudyNavbarMenu } from '@/constants/navbar'
import { FullStudy } from '@/db/study'
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { Drawer, Fab } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './StudyNavbar.module.css'

interface Props {
  environment: Environment
  studyId: UUID
  study: FullStudy
  isTransitionPlanActive: boolean
  hasObjectives: boolean
}

const StudyNavbar = ({ environment, studyId, study, isTransitionPlanActive, hasObjectives }: Props) => {
  const pathName = usePathname()

  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState<boolean>(false)
  const [isPersistent, setIsPersistent] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Measured width where the navbar doesn't overlap with the content
      setIsPersistent(window.innerWidth > 1970)
    }
  }, [])

  useEffect(() => {
    if (isPersistent) {
      setOpen(true)
    }
  }, [isPersistent])

  const { title, sections } = getStudyNavbarMenu(
    environment,
    t,
    studyId,
    study.name,
    isTransitionPlanActive,
    hasObjectives,
  )

  const handleLinkClick = () => {
    if (!isPersistent) {
      setOpen(false)
    }
  }

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
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            className: classNames('wfit hauto flex-col ml1 p0', styles.drawerContainer, open && styles.opened),
          },
          backdrop: {
            className: styles.backdrop,
          },
        }}
        variant={isPersistent ? 'persistent' : 'temporary'}
      >
        <div className={styles.drawerTitle}>
          <StudyName name={title.label} />
        </div>
        <div className={classNames('flex-col', styles.menuContent)}>
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="flex-col">
              {section.header && <div className={styles.sectionHeader}>{section.header}</div>}
              {section.links.map((link, linkIndex) =>
                link.disabled ? (
                  <button key={linkIndex} className={classNames(styles.link, styles.disabled)}>
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={linkIndex}
                    className={classNames(styles.link, { [styles.active]: pathName.includes(link.href) })}
                    href={link.href || '#'}
                    {...(link.testId && { 'data-testid': link.testId })}
                    onClick={handleLinkClick}
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </div>
      </Drawer>
    </>
  )
}

export default StudyNavbar
