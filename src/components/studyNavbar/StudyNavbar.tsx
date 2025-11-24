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
import { useState } from 'react'
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
  const [open, setOpen] = useState<boolean>(true)

  const { title, sections } = getStudyNavbarMenu(
    environment,
    t,
    studyId,
    study.name,
    isTransitionPlanActive,
    hasObjectives,
  )
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
        slotProps={{
          paper: {
            className: classNames('flex-col ml1 hauto', styles.drawerContainer),
          },
        }}
        variant="persistent"
        transitionDuration={0}
      >
        <div className={styles.drawerContent}>
          <div className={styles.titleContainer}>
            <Link className={styles.studyTitle} href={title.href}>
              <StudyName name={title.label} />
            </Link>
          </div>

          <div className={styles.menuContainer}>
            <div className={classNames('flex-col', sections.length === 1 && !sections[0].header ? '' : 'gapped15')}>
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
                      >
                        {link.label}
                      </Link>
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default StudyNavbar
