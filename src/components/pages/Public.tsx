import Image from 'next/image'
import React, { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import styles from './Public.module.css'

interface Props {
  children: ReactNode
}

const PublicPage = ({ children }: Props) => {
  const t = useTranslations('login')
  return (
    <>
      <Image className={styles.logo} src="/logos/bcp-coupe.png" alt="" width={491} height={900} />
      <div className={styles.container}>
        <div className={styles.loginForm}>
          <div className={styles.welcome}>
            <h1>{t('welcome')}</h1>
            <Image className={styles.welcomeLogo} src="/logos/bcp-with-text.png" alt="" width={228} height={40}></Image>
          </div>
          {children}
        </div>
      </div>
    </>
  )
}

export default PublicPage
