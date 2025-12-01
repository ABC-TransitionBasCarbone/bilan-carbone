'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { customRich } from '@/i18n/customRich'
import { getFormationFormStart, startFormationForm } from '@/services/serverFunctions/user'
import { MIN, TIME_IN_MS } from '@/utils/time'
import { Checkbox } from '@mui/material'
import { Formation } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import Button from '../base/Button'
import Modal from '../modals/Modal'
import EvaluationModal from './EvaluationModal'
import styles from './Formation.module.css'
import Video from './Video'

interface Props {
  formations: Formation[]
  user: UserSession
  organizationName: string
}

const timer = Number(process.env.NEXT_PUBLIC_FORMATION_TYPEFORM_DURATION)

const FormationView = ({ formations, user, organizationName }: Props) => {
  const t = useTranslations('formation')
  const tLevel = useTranslations('level')
  const { callServerFunction } = useServerFunction()
  const [open, setOpen] = useState(false)
  const [formStartTime, setFormStartTime] = useState<number | undefined>(undefined)
  const [checkedUnique, setCheckedUnique] = useState(false)

  useEffect(() => {
    const getStartTime = async () => {
      await callServerFunction(() => getFormationFormStart(user.userId), {
        onSuccess: (startDate) => {
          if (startDate) {
            setCheckedUnique(true)
            setFormStartTime(startDate.getTime())
          }
        },
      })
    }
    getStartTime()
  }, [user, callServerFunction])

  const openFormationForm = async () => {
    const now = new Date()
    if (!formStartTime) {
      await callServerFunction(() => startFormationForm(user.userId, now))
      setFormStartTime(now.getTime())
    }
    setOpen(true)
  }

  const ended = useMemo(() => formStartTime && new Date().getTime() > formStartTime + timer, [open, formStartTime])

  return (
    <>
      <div className={classNames(styles.subTitle, 'mb2')}>
        {t.rich('explanation', {
          b: (children) => <span className="bold">{children}</span>,
          time: timer / (MIN * TIME_IN_MS),
        })}
      </div>
      <h3 className="mb1">{t('warning')}</h3>
      <div className={classNames(styles.subTitle, 'mb2')}>
        {customRich(t, 'warningMessage', {
          organization: organizationName,
          name: `${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()} ${user.lastName.toUpperCase()}`,
          level: user.level ? tLevel(user.level) : '',
        })}
      </div>
      <h3 className="mb1">{t('videos')}</h3>
      <div className={classNames(styles.subTitle, 'mb2')}>{t.rich('videoExplanation')}</div>
      <div className={classNames(styles.videos, 'justify-center mb2')}>
        {formations.map((formation) => (
          <Video key={formation.id} formation={formation} />
        ))}
      </div>
      <h3 className="mb1">{t('evaluation')}</h3>

      {ended ? (
        <>{t('evaluationEnded')}</>
      ) : (
        <>
          <div className={classNames(styles.subTitle, 'mb2')}>
            {t.rich('evaluationSubtitle', {
              time: timer / (MIN * TIME_IN_MS),
              red: (children) => <span className="error">{children}</span>,
              b: (children) => <span className="bold">{children}</span>,
            })}
          </div>
          {!formStartTime && (
            <>
              <Checkbox
                checked={checkedUnique}
                onChange={() => setCheckedUnique(!checkedUnique)}
                id="form-acceptation"
              />
              <label className="pointer" htmlFor="form-acceptation">
                {t('acceptation')}
              </label>
            </>
          )}
          <div className="justify-center">
            <Button disabled={!checkedUnique} onClick={openFormationForm}>
              {t('answer')}
            </Button>
          </div>
        </>
      )}
      <Modal
        open={open && !!formStartTime && !ended}
        label="formation-evaluation"
        title={t('evaluation')}
        onClose={() => setOpen(false)}
      >
        <EvaluationModal user={user} organizationName={organizationName} startTime={formStartTime as number} />
      </Modal>
    </>
  )
}

export default FormationView
