import { getLink } from '@/services/checklist'
import { addUserChecklistItem } from '@/services/serverFunctions/user'
import ValidatedIcon from '@mui/icons-material/CheckCircle'
import ToDoIcon from '@mui/icons-material/CheckCircleOutline'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary } from '@mui/material'
import { CRUserChecklist } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Button from '../base/Button'
import LinkButton from '../base/LinkButton'
import styles from './Checklist.module.css'

interface Props {
  step: CRUserChecklist
  getCheckList: () => void
  validated: boolean
  disabled: boolean
  onClose: () => void
  organizationId: string
  clientId?: string
  studyId?: string
}

const ChecklistItem = ({
  step,
  getCheckList,
  validated,
  disabled,
  onClose,
  organizationId,
  clientId,
  studyId,
}: Props) => {
  const t = useTranslations('checklist')
  const [expanded, setExpanded] = useState(false)
  const link = useMemo(() => getLink(step, studyId), [step, studyId])

  const markAsDone = async () => {
    await addUserChecklistItem(step)
    getCheckList()
  }

  return (
    <div className="flex mb1">
      <Accordion
        className={classNames(styles.step, 'grow', { [styles.disabledStep]: disabled })}
        disabled={disabled}
        onChange={() => setExpanded(!expanded)}
        expanded={expanded && !disabled}
        sx={{
          opacity: 1,
          pointerEvents: 'auto',
          backgroundColor: 'var(--neutral-00) !important',
        }}
      >
        <AccordionSummary
          id={`checklist-${step}-summary`}
          aria-controls={`checklist-${step}`}
          data-testid={`checklist-${step}-header`}
          className={styles.stepSummary}
          expandIcon={
            validated ? (
              <b className={styles.validated}>{t('done')}</b>
            ) : disabled ? null : (
              <div data-testid={`checklist-${step}-expand`}>
                <ExpandIcon />
              </div>
            )
          }
        >
          <div className={classNames(styles.stepHeader, 'grow align-center', { [styles.validated]: validated })}>
            {validated ? <ValidatedIcon /> : <ToDoIcon />}
            {t(step)}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <p>
            {t.rich(`${step}Details`, {
              orga: (children) => (
                <Link href={`/organisations/${organizationId}/modifier`} onClick={onClose}>
                  {children}
                </Link>
              ),
              client: (children) => (
                <Link href={`/organisations/${clientId ? clientId : organizationId}/modifier`} onClick={onClose}>
                  {children}
                </Link>
              ),
            })}
          </p>
        </AccordionDetails>
        <AccordionActions>
          {!validated && (
            <div className="justify-end">
              <Button onClick={markAsDone} color="secondary">
                {t('markAsDone')}
              </Button>
            </div>
          )}
          {link && (
            <div className="justify-end">
              <LinkButton onClick={onClose} href={link}>
                <span className="px-2">{t('go')}</span>
              </LinkButton>
            </div>
          )}
        </AccordionActions>
      </Accordion>
    </div>
  )
}

export default ChecklistItem
