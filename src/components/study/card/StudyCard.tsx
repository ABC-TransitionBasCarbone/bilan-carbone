import Button from '@/components/base/Button'
import ProgressBar from '@/components/base/ProgressBar'
import { getStudyById, getStudyValidatedEmissionsSources } from '@/db/study'
import { hasAccessToStudyCardDetails, hasRoleOnStudy } from '@/services/permissions/environment'
import { getDisplayedRoleOnStudy } from '@/utils/study'
import { Study } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Box from '../../base/Box'
import GlossaryIconModal from '../../modals/GlossaryIconModal'
import styles from './StudyCard.module.css'
import StudyName from './StudyName'

interface Props {
  study: Study
  user: UserSession
  simplified?: boolean
}

const StudyCard = async ({ study, user, simplified }: Props) => {
  const t = await getTranslations('study')
  const values = await getStudyValidatedEmissionsSources(study.id)
  const fullStudy = await getStudyById(study.id, user.organizationVersionId)

  if (!values || !fullStudy) {
    return null
  }

  const showRoleInChip = hasRoleOnStudy(user.environment)
  const accountRoleOnStudy = getDisplayedRoleOnStudy(user, fullStudy)

  if (!accountRoleOnStudy) {
    return null
  }

  const percent = values.validated ? Math.floor((values.validated / values.total) * 100) : 0

  return (
    <li data-testid="study" className="flex">
      <Box className={classNames(styles.card, 'flex-col grow w100')}>
        <div className="justify-center">
          <StudyName studyId={study.id} name={study.name} role={showRoleInChip ? accountRoleOnStudy : null} />
        </div>
        {hasAccessToStudyCardDetails(user.environment) && (
          <Box>
            <p className="mb1 align-center">
              {t.rich('validatedSources', {
                validated: values.validated,
                total: values.total,
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
            href={`/etudes/${study.id}${accountRoleOnStudy === 'Contributor' ? '/contributeur' : ''}`}
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
