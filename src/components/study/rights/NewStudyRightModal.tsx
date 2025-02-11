import Modal from '@/components/base/Modal'
import { useTranslations } from 'next-intl'

interface Props {
  otherOrganization: boolean
  rightsWarning: boolean
  decline: () => void
  accept: () => void
}
const NewStudyRightModal = ({ otherOrganization, rightsWarning, decline, accept }: Props) => {
  const t = useTranslations('study.rights.new.dialog')

  return (
    <>
      <Modal
        open={otherOrganization}
        label="new-study-right"
        title={t('title')}
        onClose={decline}
        actions={[
          {
            actionType: 'button',
            onClick: decline,
            ['data-testid']: 'new-study-right-dialog-decline',
            children: t('decline'),
          },
          {
            actionType: 'button',
            onClick: accept,
            ['data-testid']: 'new-study-right-dialog-accept',
            children: t('accept'),
          },
        ]}
      >
        <div id="new-study-right-other-organization-warning">
          {t('otherOrganization')}
          {rightsWarning && ` ${t('rightsWarning')}`}
        </div>
      </Modal>
    </>
  )
}

export default NewStudyRightModal
