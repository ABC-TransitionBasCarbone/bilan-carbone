'use client'

import StudyName from '@/components/study/card/StudyName'
import { FullStudy } from '@/db/study'
import MenuIcon from '@mui/icons-material/Menu'
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { Drawer, Fab } from '@mui/material'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import styles from '../../../components/studyNavbar/StudyNavbar.module.css'

const StudyNavbar = ({ studyId, study }: { studyId: UUID; study: FullStudy }) => {
  const pathName = usePathname()

  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState<boolean>(true)

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
        <div className="flex-col gapped15 pt1">
          <div className="flex-col">
            <Link
              className={classNames(styles.studyTitle, { [styles.active]: pathName === `/etudes/${studyId}` })}
              href={`/etudes/${studyId}`}
            >
              <StudyName name={study.name} />
            </Link>
          </div>

          <div className="flex-col">
            <div className={styles.sectionHeader}>{t('informationDefinition')}</div>

            <Link
              className={classNames(styles.link, { [styles.active]: pathName.includes('cadrage') })}
              href={`/etudes/${studyId}/cadrage`}
              data-testid="study-cadrage-link"
            >
              {t('framing')}
            </Link>

            <Link
              className={classNames(styles.link, { [styles.active]: pathName.includes('perimetre') })}
              href={`/etudes/${studyId}/perimetre`}
              data-testid="study-perimetre-link"
            >
              {t('scope')}
            </Link>
          </div>

          <div className="flex-col">
            <div className={styles.sectionHeader}>{t('dataAccounting')}</div>

            <Link
              className={classNames(styles.link, { [styles.active]: pathName.includes('saisie') })}
              href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees`}
            >
              {t('dataEntry')}
            </Link>

            <Link
              className={classNames(styles.link, { [styles.active]: pathName.includes('resultats') })}
              href={`/etudes/${studyId}/comptabilisation/resultats`}
            >
              {t('results')}
            </Link>
          </div>

          <div className="flex-col">
            <div className={styles.sectionHeader}>{t('transitionPlan')}</div>

            <button className={classNames(styles.link, styles.disabled)}>{t('commingSoon')}</button>
          </div>
          <div className="flex-col">
            <div className={styles.sectionHeader}>{t('mobilisation')}</div>

            <button className={classNames(styles.link, styles.disabled)}>{t('commingSoon')}</button>
          </div>
        </div>
      </Drawer>
    </>
  )
}

export default StudyNavbar
