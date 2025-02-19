import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { ReactNode } from 'react'
import styles from './Public.module.css'

interface Props {
  children: ReactNode
}
const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const PublicPage = ({ children }: Props) => {
  const t = useTranslations('login')

  return (
    <>
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.info}>
            <p className="title-h4 mb1">{t('welcome')}</p>
            <p>{t('explaination')}</p>
            <Image src="/logos/monogramme_BC_noir.png" alt="logo" width={400} height={400} className={styles.image} />
            <p>
              {t.rich('question', {
                link: (children) => (
                  <Link href={`mailto:${contactMail}`} style={{ color: 'white' }}>
                    {children}
                  </Link>
                ),
              })}
            </p>
          </div>
          <div className={styles.loginForm}>
            <div className={styles.welcome}>
              <Image
                className={styles.welcomeLogo}
                src="/logos/logo_BC_2025_noir.png"
                alt="logo"
                width={278}
                height={136}
              />
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

export default PublicPage
