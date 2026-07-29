'use client'
import { partnerLogos } from '@/constant'
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

  return (
    <PublicContainer>
      <div className={classNames('flex wrap w100')}>
        <div className={classNames(styles.info, 'grow p2 text-center')}>
          <p className="title-h4 mb1">{t('explanation.title')}</p>
          <p className="mb1">{t('explanation.cover.subtitle')}</p>
          <p className="mb1">{t('explanation.why.summary')}</p>
          <p>{t('explanation.note.summary')}</p>
        </div>
        <div className={classNames(styles.loginForm, 'grow flex-col p2')}>
          <div className={classNames('wrap justify-center gapped-2 mb1')}>
            {partnerLogos.map((logo) => (
              <div key={logo.src} className={classNames(styles.loginLogoItem, 'flex-cc')}>
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={88}
                  height={36}
                  className={classNames(styles.loginLogoImage, 'wauto h100')}
                />
              </div>
            ))}
          </div>
          {children}
        </div>
      </div>
    </PublicContainer>
  )
}

export default PublicPage
