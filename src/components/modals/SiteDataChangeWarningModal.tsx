'use client'

import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Modal from './Modal'
import styles from './SiteDataChangeWarningModal.module.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  questionsBySubPost: Record<string, Array<{ id: string; label: string; idIntern: string; answer?: string }>>
}

const SiteDataChangeWarningModal = ({ isOpen, onClose, onConfirm, questionsBySubPost }: Props) => {
  const t = useTranslations('study.perimeter.siteDataChangeModal')
  const tPost = useTranslations('emissionFactors.post')

  const affectedSubPostsCount = Object.keys(questionsBySubPost).length

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t('title')}
      label="site-data-change-warning"
      actions={[
        {
          actionType: 'button',
          color: 'error',
          children: t('cancel'),
          onClick: onClose,
        },
        {
          actionType: 'button',
          children: t('proceed'),
          onClick: onConfirm,
        },
      ]}
    >
      <div className={styles.modalBody}>
        <p>{t('description')}</p>

        {affectedSubPostsCount > 0 && (
          <div>
            <p className="mb1">{t('affectedCalculations')}</p>

            {Object.keys(questionsBySubPost).length > 0 && (
              <div className={`my2 p1 ${styles.warningSection}`}>
                <ul>
                  {Object.entries(questionsBySubPost).map(([subPost, questions]) => (
                    <li key={subPost}>
                      <strong>{tPost(subPost)}</strong>
                      <ul className="mt-2 ml1">
                        {questions.map((question) => (
                          <li key={question.id} className="mb-2">
                            {question.label}
                            {question.answer && (
                              <div className={classNames(styles.questionAnswer, 'mb1 mt-2 p-2')}>{question.answer}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p>{t('confirmation')}</p>
      </div>
    </Modal>
  )
}

export default SiteDataChangeWarningModal
