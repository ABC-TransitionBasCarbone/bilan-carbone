import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { ReactNode } from 'react'
import styles from './Public.module.css'

interface Props {
  children: ReactNode
}
const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL
const faq = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const PublicPage = ({ children }: Props) => {
  const t = useTranslations('login')

  return (
    <>
      <div className="w100 h100 flex-cc">
        <div className={classNames(styles.container, 'flex-row')}>
          <div className={classNames(styles.info, 'grow p2 text-center')}>
            <p className="title-h4 mb1">{t('welcome')}</p>
            <p>{t('explaination')}</p>
            <Image
              src="/logos/monogramme_BC_noir.png"
              alt="logo"
              width={400}
              height={400}
              className={classNames(styles.image, 'w100')}
            />
            <p>
              {t.rich('question', {
                link: (children) => (
                  <Link href={faq} style={{ color: 'white' }} target="_blank" rel="noreferrer noopener">
                    {children}
                  </Link>
                ),
                support: (children) => (
                  <Link href={`mailto:${contactMail}`} style={{ color: 'white' }}>
                    {children}
                  </Link>
                ),
              })}
            </p>
          </div>
          <div className={classNames(styles.loginForm, 'grow flex-col')}>
            <div className="justify-end">
              <Image
                className={classNames(styles.welcomeLogo, 'align-end')}
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
