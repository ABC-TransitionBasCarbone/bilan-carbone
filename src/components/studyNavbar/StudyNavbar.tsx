'use client'

import classNames from 'classnames'
import styles from './StudyNavbar.module.css'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import MenuIcon from '@mui/icons-material/Menu'
import { Divider, Drawer, IconButton } from '@mui/material'
import { useState } from 'react'
import { UUID } from 'crypto'

const StudyNavbar = ({ studyId }: { studyId: UUID }) => {
  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState<boolean>(false)
  const [openAccountingDetails, setOpenAccountingDetails] = useState<boolean>(false)

  return (
    <>
      <div className={styles.toolbarContainer}>
        <IconButton
          data-testid="study-navbar-button"
          className={styles.openDrawerButton}
          aria-label="Ouvrir le menu de navigation de l'étude"
          onClick={() => setOpen((prev) => !prev)}
        >
          <MenuIcon />
        </IconButton>
      </div>
      <Drawer
        className={'flex-col'}
        open={open}
        PaperProps={{ className: styles.studyNavbarContainer }}
        onBlur={() => setOpen(false)}
        variant="persistent"
      >
        <Link className={styles.link} href={`/etudes/${studyId}`} onClick={() => setOpen(false)}>
          {t('homepage')}
        </Link>
        <Divider />
        <Link
          className={styles.link}
          href={`/etudes/${studyId}/cadrage`}
          onClick={() => setOpen(false)}
          data-testid="study-cadrage-link"
        >
          {t('framing')}
        </Link>
        <Divider />
        <Link className={styles.link} href={`/etudes/${studyId}/perimetre`} onClick={() => setOpen(false)}>
          {t('scope')}
        </Link>
        <Divider />
        <div className={styles.link} onClick={() => setOpen(false)}>
          {t('mobilisation')}
        </div>
        <Divider />
        <div>
          <button className={styles.button} onClick={() => setOpenAccountingDetails((prev) => !prev)}>
            {t('accounting')}
          </button>
          {openAccountingDetails && (
            <>
              <Divider />
              <Link
                className={classNames(styles.link, styles.childrenLink)}
                href={`/etudes/${studyId}/comptabilisation/saisie-des-donnees`}
                onClick={() => setOpen(false)}
              >
                {t('dataEntry')}
              </Link>
              <Divider />
              <Link
                className={classNames(styles.link, styles.childrenLink)}
                href={`/etudes/${studyId}/comptabilisation/resultats`}
                onClick={() => setOpen(false)}
              >
                {t('results')}
              </Link>
            </>
          )}
        </div>
        <Divider />
        <button className={styles.button} onClick={() => setOpen(false)}>
          {t('transitionPlan')}
        </button>
      </Drawer>
    </>
  )
}

export default StudyNavbar
