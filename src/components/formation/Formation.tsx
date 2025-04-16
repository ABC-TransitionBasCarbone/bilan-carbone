'use client'

import { getFormationFormStart, startFormationForm } from '@/services/serverFunctions/user'
import { MIN, TIME_IN_MS } from '@/utils/time'
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
  organisationName: string
}

const timer = Number(process.env.NEXT_PUBLIC_TYPEFORM_DURATION)

const FormationView = ({ formations, user, organisationName }: Props) => {
  const t = useTranslations('formation')
  const [open, setOpen] = useState(false)
  const [formStartTime, setFormStartTime] = useState<number | undefined>(undefined)

  useEffect(() => {
    const getStartTime = async () => {
      const startDate = await getFormationFormStart(user.id)
      if (startDate) {
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
            {t('evaluationSubtitle', { time: timer / (MIN * TIME_IN_MS) })}
          </div>
          <div className="justify-center" onClick={openFormationForm}>
            <Button>{t('answer')}</Button>
          </div>
        </>
      )}
      <Modal
        open={open && !!formStartTime && !ended}
        label="formation-evaluation"
        title={t('evaluation')}
        onClose={() => setOpen(false)}
      >
        <EvaluationModal
          user={user}
          organizationName={organisationName}
          onClose={() => setOpen(false)}
          startTime={formStartTime as number}
        />
      </Modal>
    </>
  )
}

export default FormationView
