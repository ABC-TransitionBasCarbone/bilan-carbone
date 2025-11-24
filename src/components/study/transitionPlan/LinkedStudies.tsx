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
        className={classNames(styles.linkedStudiesCard, { [styles.expanded]: expanded })}
        disableGutters
        elevation={0}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <div className="flex align-center gapped1" style={{ marginRight: '1rem' }}>
            <LinkIcon fontSize="small" color="primary" />
            <Typography variant="caption" className={styles.badge} color="text.secondary">
              {t('linked')}
            </Typography>
          </div>
        </AccordionSummary>
        <AccordionDetails className={classNames('flex-col', 'gapped1', styles.details)}>
          {pastStudies.length === 0 ? (
            <div className="flex align-center justify-between">
              <Typography variant="body2" color="text.secondary">
                {t('noLinkedStudies')}
              </Typography>
              {canEdit && (
                <Button onClick={() => setLinking(true)} size="small">
                  {t('linkStudy')}
                </Button>
              )}
            </div>
          ) : (
            <>
              {canEdit && (
                <div className="flex justify-end">
                  <Button onClick={() => setLinking(true)} size="small">
                    {t('linkStudy')}
                  </Button>
                </div>
              )}
              <LinkedStudiesTable
                transitionPlanId={transitionPlanId}
                pastStudies={pastStudies}
                onEdit={(study) => setEditTarget(study)}
                canEdit={canEdit}
              />
            </>
          )}
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
