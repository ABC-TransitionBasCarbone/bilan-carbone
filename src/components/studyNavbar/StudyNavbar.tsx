'use client'

import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import MenuIcon from '@mui/icons-material/Menu'
import { Divider, Drawer, IconButton } from '@mui/material'
import { Environment } from '@prisma/client'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import styles from './StudyNavbar.module.css'

const StudyNavbar = ({ studyId }: { studyId: UUID }) => {
  const pathName = usePathname()

  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState<boolean>(true)

  const { environment } = useAppEnvironmentStore()
  const isCut = environment === Environment.CUT

  return (
    <>
      <div className={styles.toolbarContainer}>
        <IconButton
          data-testid="study-navbar-button"
          className={styles.openDrawerButton}
          aria-label={t('menu')}
          title={t('menu')}
          onClick={() => setOpen((prev) => !prev)}
        >
          <MenuIcon />
        </IconButton>
      </div>
      <Drawer
        className={open ? styles.opened : ''}
        open={open}
        PaperProps={{ className: styles.studyNavbarContainer }}
        variant="persistent"
      >
        <Link
          className={classNames(styles.link, { [styles.active]: pathName === `/etudes/${studyId}` })}
          href={`/etudes/${studyId}`}
        >
          {t('homepage')}
        </Link>
        <Divider />
        {!isCut && (
          <>
            <Link
              className={classNames(styles.link, { [styles.active]: pathName.includes('cadrage') })}
              href={`/etudes/${studyId}/cadrage`}
              data-testid="study-cadrage-link"
            >
              {t('framing')}
            </Link>
            <Divider />
            <Link
              className={classNames(styles.link, { [styles.active]: pathName.includes('perimetre') })}
              href={`/etudes/${studyId}/perimetre`}
              data-testid="study-perimetre-link"
            >
              {t('scope')}
            </Link>
            <Divider />
            <button className={classNames(styles.link, styles.disabled)} onClick={() => setOpen(false)}>
              {t('mobilisation')} (<em>{t('coming')}</em>)
            </button>
            <Divider />
          </>
        )}

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
          {isCut && (
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
          )}
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
        <Divider />
        {!isCut && (
          <button className={classNames(styles.button, styles.disabled)}>
            {t('transitionPlan')} (<em>{t('coming')}</em>)
          </button>
        )}
      </Drawer>
    </>
  )
}

export default StudyNavbar
