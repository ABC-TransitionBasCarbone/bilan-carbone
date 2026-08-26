'use client'

import { PARTNER_LOGOS } from '@/constants/logos'
import { Button, Container, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import styles from './Survey.module.css'

interface Props {
  onStart: () => void
}

const SurveyExplanation = ({ onStart }: Props) => {
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

      <Container maxWidth="lg" className={classNames(styles.explanationCard, 'pt2', 'pb2')}>
        <div
          className={classNames(
            'wrap',
            'overflow-hidden',
            'justify-center',
            'align-center',
            'gapped075',
            'pb-2',
            'mb2',
          )}
        >
          {PARTNER_LOGOS.map((logo) => (
            <div key={logo.src} className={classNames(styles.logoSlot, 'flex-cc')}>
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                sizes="(max-width: 768px) 38vw, 168px"
                className={styles.logoFit}
              />
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
