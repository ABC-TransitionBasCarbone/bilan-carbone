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
}

const StudyNavbar = ({ environment, studyId, study }: Props) => {
  const pathName = usePathname()

  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState<boolean>(true)

  const { title, sections } = getStudyNavbarMenu(environment, t, studyId, study.name)
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
            className: styles.drawerContainer,
          },
        }}
        variant="persistent"
        transitionDuration={0}
      >
        <div className={classNames('flex-col pt1', sections.length === 1 && !sections[0].header ? '' : 'gapped15')}>
          <div className="flex-col">
            <Link
              className={classNames(styles.studyTitle, { [styles.active]: pathName === `/etudes/${studyId}` })}
              href={title.href}
            >
              <StudyName name={title.label} />
            </Link>
          </div>

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
      </Drawer>
    </>
  )
}

export default StudyNavbar
