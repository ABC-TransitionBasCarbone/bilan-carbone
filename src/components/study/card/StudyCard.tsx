import Button from '@/components/base/Button'
import ProgressBar from '@/components/base/ProgressBar'
import { StudyCardItem } from '@/db/study'
import { customRich } from '@/i18n/customRich'
import { hasAccessToStudyCardDetails, hasRoleOnStudy } from '@/services/permissions/environment'
import { getDisplayedRoleOnStudy } from '@/utils/study'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Box from '../../base/Box'
import GlossaryIconModal from '../../modals/GlossaryIconModal'
import styles from './StudyCard.module.css'
import StudyName from './StudyName'

interface Props {
  study: StudyCardItem
  user: UserSession
  simplified?: boolean
}

const StudyCard = ({ study, user, simplified }: Props) => {
  const t = useTranslations('study')
  const { id, name, validatedSources } = study

  const showRoleInChip = hasRoleOnStudy(user.environment)
  const accountRoleOnStudy = getDisplayedRoleOnStudy(user, study)

  if (!accountRoleOnStudy) {
    return null
  }

  const percent = validatedSources.validated
    ? Math.floor((validatedSources.validated / validatedSources.total) * 100)
    : 0

  return (
    <li data-testid="study" className="flex">
      <Box className={classNames(styles.card, 'flex-col grow w100')}>
        <div className="justify-center">
          <StudyName studyId={id} name={name} role={showRoleInChip ? accountRoleOnStudy : null} />
        </div>
        {hasAccessToStudyCardDetails(user.environment) && (
          <Box>
            <p className="mb1 align-center">
              {customRich(t, 'validatedSources', {
                validated: validatedSources.validated,
                total: validatedSources.total,
                data: (children) => (
                  <span className={classNames(styles.validated, 'mr-4', { [styles.success]: percent === 100 })}>
                    {children}
                  </span>
                ),
              })}
              <GlossaryIconModal
                title="validatedOnly"
                className={`ml-2 ${styles.helpIcon}`}
                iconLabel="information"
                label="study-card"
                tModal="study"
              >
                {t('validatedOnlyDescription')}
              </GlossaryIconModal>
            </p>
            <ProgressBar
              value={percent}
              barClass={classNames(styles.progressBar, { [styles.success]: percent === 100 })}
            />
          </Box>
        )}
        <div className="justify-end">
          <Button
            href={`/etudes/${id}${accountRoleOnStudy === 'Contributor' ? '/contributeur' : ''}`}
            data-testid="study-link"
          >
            {t(simplified ? 'seeSimplified' : 'see')}
          </Button>
        </div>
      </Box>
    </li>
  )
}

export default StudyCard
