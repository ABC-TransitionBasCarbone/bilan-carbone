import Modal from '@/components/modals/Modal'
import { handleWarningText } from '@/utils/components'
import { useTranslations } from 'next-intl'

interface Props {
  otherOrganizationVersion: boolean
  rightsWarning?: boolean
  loading: boolean
  decline: () => void
  accept: () => void
}
const NewStudyRightModal = ({ otherOrganizationVersion, rightsWarning, loading, decline, accept }: Props) => {
  const t = useTranslations('study.rights.new.dialog')

  return (
    <>
      <Modal
        open={otherOrganizationVersion}
        label="new-study-right"
        title={t('title')}
        onClose={decline}
        actions={[
          {
            actionType: 'button',
            onClick: decline,
            ['data-testid']: 'new-study-right-modal-decline',
            children: t('decline'),
          },
          {
            actionType: 'loadingButton',
            onClick: accept,
            ['data-testid']: 'new-study-right-modal-accept',
            children: t('accept'),
            loading,
          },
        ]}
      >
        <div id="new-study-right-other-organization-warning">
          {handleWarningText(t, 'otherOrganization')}
          {rightsWarning && ` ${t('rightsWarning')}`}
        </div>
      </Modal>
    </>
  )
}

export default NewStudyRightModal
