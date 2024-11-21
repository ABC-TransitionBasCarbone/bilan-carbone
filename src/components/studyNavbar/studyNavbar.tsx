"use client"
import classNames from "classnames"
import styles from './studyNavbar.module.css'
import { useTranslations } from "next-intl"
import Link from "next/link"
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Divider, Drawer, IconButton } from "@mui/material"
import { useState } from "react"
import { UUID } from "crypto"


const StudyNavbar = ({ studyId }: { studyId: UUID }) => {
    const t = useTranslations('study.navigation')
    const [open, setOpen] = useState<boolean>(false);
    const [openAccountingDetails, setOpenAccountingDetails] = useState<boolean>(false);

    return <>
        <div className={styles.toolbarContainer}>
            <IconButton
                className={styles.openDrawerButton}
                color="inherit"
                aria-label="open drawer"
                onClick={() => setOpen(prev => !prev)}
                edge="start"
            >
                <MenuIcon />
            </IconButton>
        </div>
        <div>
            <Drawer
                className={classNames('flex-col')}
                open={open}
                PaperProps={{ className: classNames(styles.studyNavbarContainer) }}
                onBlur={() => setOpen(false)}
                variant="persistent"
            >
                <div className={classNames(styles.buttonContainer)}>
                    <IconButton onClick={() => setOpen(false)} color="primary" className={classNames(styles.button)}>
                        <ChevronLeftIcon />
                    </IconButton>
                </div>
                <Divider />
                <Link className={styles.link} href={`/etudes/${studyId}`} onClick={() => setOpen(false)}>
                    {t('homepage')}
                </Link>
                <Divider />
                <Link className={styles.link} href={`/etudes/${studyId}/cadrage`} onClick={() => setOpen(false)}>
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
                    <div className={styles.link} onClick={() => setOpenAccountingDetails((prev) => !prev)}>{t('accounting')}</div>
                    {openAccountingDetails && <div>
                        <Divider style={{ marginLeft: "1.5rem" }} />
                        <Link className={classNames(styles.link, styles.childrenLink)} href={`/etudes/${studyId}/accounting/data-entry`} onClick={() => setOpen(false)}>
                            {t('data-entry')}
                        </Link>
                        <Divider style={{ marginLeft: "1.5rem" }} />
                        <Link className={classNames(styles.link, styles.childrenLink)} href={`/etudes/${studyId}/accounting/results`} onClick={() => setOpen(false)}>
                            {t('results')}
                        </Link>
                    </div>}
                </div>
                <Divider />
                <div className={styles.link} onClick={() => setOpen(false)}>
                    {t('transition-plan')}
                </div>
                <Divider />
            </Drawer>
        </div>
    </>
}

export default StudyNavbar