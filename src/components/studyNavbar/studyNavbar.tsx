"use client"
import classNames from "classnames"
import styles from './studyNavbar.module.css'
import { useTranslations } from "next-intl"
import Link from "next/link"
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Drawer, IconButton } from "@mui/material"
import { useState } from "react"
import { UUID } from "crypto"


const StudyNavbar = ({ studyId }: { studyId: UUID }) => {
    const t = useTranslations('study.navigation')
    const [open, setOpen] = useState<boolean>(false);

    return <>
        {!open && <div className={styles.toolbarContainer}>
            <div className={styles.openDrawerButton}>                
                <IconButton
                    color="inherit"
                    style={{ margin: "0px", padding: "0px"}}
                    aria-label="open drawer"
                    onClick={() => setOpen(prev => !prev)}
                    edge="start"
                >
                    <MenuIcon />
                </IconButton>
            </div>
        </div>}
        <div>
            <Drawer className={classNames('flex-col')} open={open} PaperProps={{ className: classNames(styles.studyNavbarContainer) }}>
                <div className={classNames(styles.buttonContainer)}>
                    <IconButton onClick={() => setOpen(false)} color="primary" className={classNames(styles.button)}>
                        <ChevronLeftIcon />
                    </IconButton>
                </div>
                <Link className={styles.link} href={`/etudes/${studyId}`}>
                    {t('homepage')}
                </Link>
                <Link className={styles.link} href={`/etudes/${studyId}/cadrage`}>
                    {t('framing')}
                </Link>
                <Link className={styles.link} href={`/etudes/${studyId}/perimetre`}>
                    {t('scope')}
                </Link>
                <div className={styles.link}>
                    {t('mobilisation')}
                </div>
                <Link className={styles.link} href={`/etudes/${studyId}/accounting/data-entry`}>
                    {t('data-entry')}
                </Link>
                <div className={styles.link}>
                    {t('transition-plan')}
                </div>
            </Drawer>
        </div>
    </>
}

export default StudyNavbar