'use client'

import Button from '@/components/base/Button'
import { PastStudy } from '@/utils/trajectory'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinkIcon from '@mui/icons-material/Link'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import styles from './LinkedStudies.module.css'
import LinkedStudiesTable from './LinkedStudiesTable'

const LinkingStudyModal = dynamic(() => import('./LinkingStudyModal'), {
  ssr: false,
})

interface Props {
  transitionPlanId: string
  studyId: string
  studyYear: Date
  pastStudies: PastStudy[]
  canEdit: boolean
}

const LinkedStudies = ({ transitionPlanId, studyId, studyYear, pastStudies, canEdit }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies')
  const [linking, setLinking] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [editTarget, setEditTarget] = useState<PastStudy | null>(null)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('linked-studies-expanded')
    if (stored !== null) {
      setExpanded(stored === 'true')
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('linked-studies-expanded', String(expanded))
    }
  }, [expanded, mounted])

  if (!mounted) {
    return null
  }

  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        className={classNames(styles.linkedStudiesCard)}
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
          <div className="flex align-center justify-between w100" style={{ marginRight: '1rem' }}>
            <div className="flex align-center gapped1">
              <LinkIcon fontSize="small" color="primary" />
              <Typography variant="caption" className={styles.badge} color="text.secondary">
                {t('linked')}
              </Typography>
            </div>
            {canEdit && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  setLinking(true)
                }}
                size="small"
              >
                {t('linkStudy')}
              </Button>
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails className={classNames('flex-col', 'gapped1', styles.details)}>
          <LinkedStudiesTable
            transitionPlanId={transitionPlanId}
            pastStudies={pastStudies}
            onEdit={(study) => setEditTarget(study)}
            canEdit={canEdit}
          />
        </AccordionDetails>
      </Accordion>
      {(linking || editTarget) && (
        <LinkingStudyModal
          transitionPlanId={transitionPlanId}
          studyId={studyId}
          studyYear={studyYear}
          open={linking || !!editTarget}
          onClose={() => {
            setLinking(false)
            setEditTarget(null)
          }}
          linkedStudyIds={pastStudies.filter((s) => s.type === 'linked').map((s) => s.id)}
          pastStudyToUpdate={editTarget}
        />
      )}
    </>
  )
}

export default LinkedStudies
