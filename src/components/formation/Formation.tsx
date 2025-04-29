'use client'

import { getFormationFormStart, startFormationForm } from '@/services/serverFunctions/user'
import { MIN, TIME_IN_MS } from '@/utils/time'
import { Checkbox } from '@mui/material'
import { Formation } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import Button from '../base/Button'
import Modal from '../modals/Modal'
import EvaluationModal from './EvaluationModal'
import styles from './Formation.module.css'
import Video from './Video'

interface Props {
  formations: Formation[]
  user: User
  organizationName: string
}

const timer = Number(process.env.NEXT_PUBLIC_TYPEFORM_DURATION)

const FormationView = ({ formations, user, organizationName }: Props) => {
  const t = useTranslations('formation')
  const [open, setOpen] = useState(false)
  const [formStartTime, setFormStartTime] = useState<number | undefined>(undefined)
  const [checkedUnique, setCheckedUnique] = useState(false)

  useEffect(() => {
    const getStartTime = async () => {
      const startDate = await getFormationFormStart(user.id)
      if (startDate) {
        setCheckedUnique(true)
        setFormStartTime(startDate.getTime())
      }
    }
    getStartTime()
  }, [user])

  const openFormationForm = () => {
    const now = new Date()
    if (!formStartTime) {
      startFormationForm(user.id, now)
      setFormStartTime(now.getTime())
    }
    setOpen(true)
  }

  const ended = useMemo(() => formStartTime && new Date().getTime() > formStartTime + timer, [open, formStartTime])

  return (
    <>
      <div className={classNames(styles.subTitle, 'mb2')}>{t('explaination')}</div>
      <h3 className="mb1">{t('warning')}</h3>
      <div className={classNames(styles.subTitle, 'mb2')}>
        {t.rich('warningMessage', {
          organization: organizationName,
          name: `${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase()} ${user.lastName.toUpperCase()}`,
          error: (children) => <span className="error">{children}</span>,
          b: (children) => <span className="bold">{children}</span>,
          i: (children) => <span className="italic">{children}</span>,
          br: () => <br />,
        })}
      </div>
      <h3 className="mb1">{t('videos')}</h3>
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
