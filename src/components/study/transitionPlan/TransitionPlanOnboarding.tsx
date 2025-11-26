'use client'

import Button from '@/components/base/Button'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SchoolIcon from '@mui/icons-material/School'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useState } from 'react'
import styles from './TransitionPlanOnboarding.module.css'

interface Props {
  title: string
  description: string
  detailedContent: ReactNode
  storageKey: string
}

const TransitionPlanOnboarding = ({ title, description, detailedContent, storageKey }: Props) => {
  const t = useTranslations('study.transitionPlan.onboarding')
  const [expanded, setExpanded] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(`onboarding-${storageKey}`)
    if (stored !== null) {
      setExpanded(stored === 'true')
    }
  }, [storageKey])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(`onboarding-${storageKey}`, String(expanded))
    }
  }, [expanded, storageKey, mounted])

  if (!mounted) {
    return null
  }

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      className={classNames(styles.onboardingCard)}
      disableGutters
      elevation={0}
      sx={{
        '& .MuiAccordionSummary-root': {
          padding: expanded ? '1.5rem' : '1rem 1.5rem',
          transition: 'padding 0.2s ease',
          minHeight: 'auto',
        },
        '& .MuiAccordionSummary-content': {
          margin: 0,
        },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <div className={classNames('flex', 'align-center', 'gapped1')}>
          <SchoolIcon fontSize="small" color="primary" />
          <Typography variant="caption" className={styles.badge} color="text.secondary">
            {t('badge')}
          </Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails className={classNames('flex-col', 'gapped1', styles.details)}>
        <Typography variant="h5" component="h2" fontWeight={'600'}>
          {title}
        </Typography>
        <Typography variant="body1">{description}</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(!showDetails)
          }}
          className={'wfit px1'}
        >
          {showDetails ? t('hideDetails') : t('learnMore')}
        </Button>
        {showDetails && (
          <Typography variant="body1" className={classNames('mt1', styles.detailsText)}>
            {detailedContent}
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export default TransitionPlanOnboarding
