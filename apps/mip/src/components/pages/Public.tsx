'use client'
import { PARTNER_LOGOS } from '@/constants/logos'
import PublicContainer from '@abc-transitionbascarbone/components/src/base/PublicContainer'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ReactNode } from 'react'
import styles from './Public.module.css'

interface Props {
  children: ReactNode
}

const PublicPage = ({ children }: Props) => {
  const t = useTranslations('survey')
  const logo = PARTNER_LOGOS.find((logo) => logo.alt === 'ABC')

  return (
    <PublicContainer>
      <div className={classNames(styles.content, 'flex w100')}>
        <div className={classNames(styles.info, 'grow p2 text-center')}>
          <p className="title-h4 mb1">{t('explanation.title')}</p>
          <p className="mb1">{t('explanation.why.summary')}</p>
        </div>
        <div className={classNames(styles.loginForm, 'grow flex-col p2')}>
          <div className={classNames('wrap justify-center gapped-2 mb1')}>
            {logo && (
              <div key={logo.src} className="flex-cc">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={176}
                  height={72}
                  className={classNames(styles.loginLogoImage, 'wauto hauto')}
                />
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </PublicContainer>
  )
}

export default PublicPage
