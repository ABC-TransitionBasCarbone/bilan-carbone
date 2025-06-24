'use client'

import MenuIcon from '@mui/icons-material/Menu'
import { Divider, Drawer, Fab } from '@mui/material'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import commonStyles from './../../../components/studyNavbar/StudyNavbar.module.css'
import styles from './StudyNavbar.module.css'

const StudyNavbarCut = ({ studyId }: { studyId: UUID }) => {
  const pathName = usePathname()

  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState<boolean>(true)

  return (
    <>
      <div className={commonStyles.toolbarContainer}>
        <Fab
          color="primary"
          data-testid="study-navbar-button"
          className={commonStyles.openDrawerButton}
          aria-label={t('menu')}
          title={t('menu')}
          onClick={() => setOpen((prev) => !prev)}
        >
          <MenuIcon />
        </Fab>
      </div>
      <Drawer
        className={open ? commonStyles.opened : ''}
        open={open}
        PaperProps={{ className: commonStyles.studyNavbarContainer }}
        variant="persistent"
      >
        <Link
          className={classNames(styles.link, { [styles.active]: pathName === `/etudes/${studyId}` })}
          href={`/etudes/${studyId}`}
        >
          {t('homepage')}
        </Link>
        <Divider />

        <div>
          <div
            className={classNames(
              styles.section,
              { [styles.active]: pathName.includes('comptabilisation') },
              'align-center',
            )}
          >
            {t('accounting')}
          </div>

          <Divider />
          <>
            <Link
              className={classNames(
                styles.link,
                { [styles.active]: pathName.includes('cadrage') },
                styles.childrenLink,
              )}
              href={`/etudes/${studyId}/cadrage`}
              data-testid="study-cadrage-link"
            >
              {t('framing')}
            </Link>
            <Divider />
          </>
          <Link
            className={classNames(styles.link, { [styles.active]: pathName.includes('saisie') }, styles.childrenLink)}
            href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees`}
          >
            {t('dataEntry')}
          </Link>
          <Divider />
          <Link
            className={classNames(
              styles.link,
              { [styles.active]: pathName.includes('resultats') },
              styles.childrenLink,
            )}
            href={`/etudes/${studyId}/comptabilisation/resultats`}
          >
            {t('results')}
          </Link>
        </div>
      </Drawer>
    </>
  )
}

export default StudyNavbarCut
