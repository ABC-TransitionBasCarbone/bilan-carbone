import ValidatedIcon from '@mui/icons-material/CheckCircle'
import ToDoIcon from '@mui/icons-material/CheckCircleOutline'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionSummary } from '@mui/material'
import { CRUserChecklist } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './Checklist.module.css'

interface Props {
  step: CRUserChecklist
  validated: boolean
}

const ChecklistItem = ({ step, validated }: Props) => {
  const t = useTranslations('checklist')
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
          <div className={classNames(styles.stepHeader, 'align-center', { [styles.validated]: validated })}>
            {validated ? <ValidatedIcon /> : <ToDoIcon />}
            {step}
          </div>
        </AccordionSummary>
      </Accordion>
    </div>
  )
}

export default ChecklistItem
