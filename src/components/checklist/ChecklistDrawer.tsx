import { customRich } from '@/i18n/customRich'
import { getUserCheckList, mandatoryParentSteps } from '@/services/checklist'
import { Level, OrganizationVersion, Role, UserChecklist } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Stepper from '../base/Stepper'
import styles from './Checklist.module.css'
import ChecklistItem from './ChecklistItem'

interface Props {
  setOpen: (open: boolean) => void
  getCheckList: () => void
  userChecklist: UserChecklist[]
  userRole: Role
  userLevel: Level | null
  accountOrganizationVersion: OrganizationVersion
  clientId?: string
  studyId?: string
}

const ChecklistDrawer = ({
  setOpen,
  getCheckList,
  userRole,
  userLevel,
  accountOrganizationVersion,
  clientId,
  userChecklist,
  studyId,
}: Props) => {
  const environment = accountOrganizationVersion.environment
  const t = useTranslations('checklist')
  const steps = useMemo(
    () => getUserCheckList(userRole, accountOrganizationVersion.isCR, userLevel),
    [userRole, userLevel, accountOrganizationVersion],
  )
  const finished = useMemo(() => userChecklist.length === Object.values(steps).length - 1, [userChecklist, steps])
  const isValidated = (step: UserChecklist) => userChecklist.some((checkedStep) => checkedStep === step)
  const isDisabled = (step: UserChecklist) =>
    mandatoryParentSteps(step, userRole, accountOrganizationVersion.isCR, userLevel).some(
      (mandatoryStep) => !userChecklist.includes(mandatoryStep),
    )
  return (
    <div>
      <Stepper
        className={classNames(styles.drawer, styles.centered)}
        activeStep={userChecklist.length}
        steps={Object.keys(steps).length - 1}
        fillValidatedSteps
        small
      />

      <div className="flex-col px-2">
        {Object.values(steps)
          .filter((step) => step !== UserChecklist.Completed)
          .map((step: UserChecklist) => (
            <ChecklistItem
              key={step}
              step={step}
              getCheckList={getCheckList}
              validated={isValidated(step)}
              disabled={isValidated(step) || isDisabled(step)}
              onClose={() => setOpen(false)}
              organizationVersionId={accountOrganizationVersion.id}
              clientId={clientId}
              studyId={studyId}
            />
          ))}
      </div>
      {finished && <p className="px-2">{customRich(t, 'finished', {}, environment)}</p>}
    </div>
  )
}

export default ChecklistDrawer
