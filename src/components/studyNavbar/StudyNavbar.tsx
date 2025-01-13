'use client'

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import MenuIcon from '@mui/icons-material/Menu'
import { Divider, Drawer, IconButton } from '@mui/material'
import classNames from 'classnames'
import { UUID } from 'crypto'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './StudyNavbar.module.css'

const uuid = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const StudyNavbar = ({ studyId }: { studyId: UUID }) => {
  const pathName = usePathname()

  const t = useTranslations('study.navigation')
  const [open, setOpen] = useState<boolean>(false)
  const [openAccountingDetails, setOpenAccountingDetails] = useState<boolean>(false)

  useEffect(() => {
    setOpen(pathName.match(uuid) !== null)
  }, [pathName])
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
        <button className={classNames(styles.link, styles.disabled)} onClick={() => setOpen(false)}>
          {t('mobilisation')} (<em>à venir</em>)
        </button>
        <Divider />
        <div>
          <button
            className={classNames(styles.button, styles.openable, 'align-center')}
            onClick={() => setOpenAccountingDetails((prev) => !prev)}
          >
            {openAccountingDetails ? (
              <KeyboardArrowDownIcon className={styles.icon} />
            ) : (
              <KeyboardArrowRightIcon className={styles.icon} />
            )}
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
        <button className={classNames(styles.button, styles.disabled)} onClick={() => setOpen(false)}>
          {t('transitionPlan')} (<em>à venir</em>)
        </button>
      </Drawer>
    </>
  )
}

export default StudyNavbar
