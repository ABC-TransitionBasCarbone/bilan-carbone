import { getLink } from '@/services/checklist'
import { addUserChecklistItem } from '@/services/serverFunctions/user'
import ValidatedIcon from '@mui/icons-material/CheckCircle'
import ToDoIcon from '@mui/icons-material/CheckCircleOutline'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary } from '@mui/material'
import { CRUserChecklist, Organization } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import Button from '../base/Button'
import LinkButton from '../base/LinkButton'
import styles from './Checklist.module.css'

interface Props {
  step: CRUserChecklist
  validated: boolean
  onClose: () => void
  organizationId: string
  clients?: Organization[]
  studyId?: string
}

const ChecklistItem = ({ step, validated, onClose, organizationId, clients, studyId }: Props) => {
  const t = useTranslations('checklist')
  const link = useMemo(() => getLink(step, studyId), [step, studyId])
  const router = useRouter()

  const markAsDone = async () => {
    await addUserChecklistItem(step)
    router.refresh()
  }

  return (
    <div className="flex mb1">
      <Accordion
        className={classNames(styles.step, 'grow', { [styles.disabledStep]: validated })}
        disabled={validated}
        sx={{
          opacity: 1,
          pointerEvents: 'auto',
          backgroundColor: 'var(--neutral-00) !important',
        }}
      >
        <div>
          <AccordionSummary
            id={`checklist-${step}-summary`}
            aria-controls={`checklist-${step}`}
            data-testid={`checklist-${step}-header`}
            className={styles.stepSummary}
            expandIcon={
              validated ? (
                <b className={styles.validated}>{t('done')}</b>
              ) : (
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
        </div>
        <AccordionDetails>
          <p>
            {t.rich(`${step}Details`, {
              orga: (children) => (
                <Link href={`/organisations/${organizationId}/modifier`} onClick={onClose}>
                  {children}
                </Link>
              ),
              client: (children) => (
                <Link href={`/organisations/${clients ? clients[0].id : organizationId}/modifier`} onClick={onClose}>
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
