'use client'

import { Button, Container, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import styles from './Survey.module.css'

type PartnerLogo = {
  src: string
  alt: string
}

interface Props {
  partnerLogos: PartnerLogo[]
  onStart: () => void
}

const SurveyExplanation = ({ partnerLogos, onStart }: Props) => {
  const t = useTranslations('survey')

  return (
    <div className={styles.explanationPage}>
      <Container maxWidth="md" className={classNames('text-center', 'pt1', 'pb2')}>
        <Typography variant="h3" component="h1" className={styles.coverTitle}>
          {t('explanation.cover.title')}
        </Typography>
        <Typography className={styles.coverSubtitle}>{t('explanation.cover.subtitle')}</Typography>
        <div className={classNames('justify-center')}>
          <Button variant="contained" onClick={onStart}>
            {t('explanation.start')}
          </Button>
        </div>
      </Container>

      <Container maxWidth="md" className={classNames(styles.explanationCard, 'pt2', 'pb2')}>
        <div className={styles.logosRow}>
          {partnerLogos.map((logo) => (
            <div key={logo.src} className={styles.logoItem}>
              <Image src={logo.src} alt={logo.alt} width={168} height={72} className={styles.logoImage} />
            </div>
          ))}
        </div>

        <section className={classNames('mb2')}>
          <Typography variant="h4" component="h2" className={styles.explanationTitle}>
            {t('explanation.why.title')}
          </Typography>
          <div className={styles.titleUnderline} />
          <Typography>{t('explanation.why.description')}</Typography>
        </section>

        <section className={classNames('mb2')}>
          <Typography variant="h5" component="h2" className={styles.explanationSubtitle}>
            {t('explanation.about.title')}
          </Typography>
          <Typography>{t('explanation.about.description')}</Typography>
        </section>

        <section className={classNames('mb2')}>
          <Typography variant="h5" component="h2" className={styles.explanationSubtitle}>
            {t('explanation.note.title')}
          </Typography>
          <Typography>{t('explanation.note.description')}</Typography>
        </section>
      </Container>
    </div>
  )
}

export default SurveyExplanation
