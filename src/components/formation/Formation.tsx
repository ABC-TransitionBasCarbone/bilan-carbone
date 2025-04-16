'use client'

import { Formation } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Button from '../base/Button'
import Modal from '../modals/Modal'
import EvaluationModal from './EvaluationModal'
import styles from './Formation.module.css'
import Video from './Video'

interface Props {
  formations: Formation[]
  user: UserSession
  organisationName: string
}

const FormationView = ({ formations, user, organisationName }: Props) => {
  const t = useTranslations('formation')
  const [open, setOpen] = useState(false)
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
      <div className={classNames(styles.subTitle, 'mb2')}>{t('evaluationSubtitle')}</div>
      <div className="justify-center" onClick={() => setOpen(true)}>
        <Button>{t('answer')}</Button>
      </div>
      <Modal open={open} label="formation-evaluation" title={t('evaluation')} onClose={() => setOpen(false)}>
        <EvaluationModal user={user} organisationName={organisationName} />
      </Modal>
    </>
  )
}

export default FormationView
