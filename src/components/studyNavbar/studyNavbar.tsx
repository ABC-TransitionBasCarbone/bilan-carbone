"use client"
import classNames from "classnames"
import styles from './studyNavbar.module.css'
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Drawer } from "@mui/material"
import { useState } from "react"


const StudyNavbar = () => {
    const t = useTranslations('study.navigation')
    const [open, setOpen] = useState<boolean>(false);

    return <>
        <div onClick={() => setOpen(prev => !prev)} className={classNames(styles.button)}>test</div>
        <div className={classNames(styles.studyNavbar)}>
            <Drawer className={classNames(styles.studyNavbarContainer, 'flex-col')} open={open}>
                <Link className={styles.link} href="/">
                    {t('homepage')}
                </Link>
                <Link className={styles.link} href="/cadrage">
                    {t('framing')}
                </Link>
                <Link className={styles.link} href="/perimetre">
                    {t('scope')}
                </Link>
                <div className={styles.link}>
                    {t('mobilisation')}
                </div>
                <Link className={styles.link} href="/accounting">
                    {t('accounting')}
                </Link>
                <div className={styles.link}>
                    {t('transition-plan')}
                </div>
            </Drawer>
        </div>
    </>
}

export default StudyNavbar