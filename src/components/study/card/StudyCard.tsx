import Label from '@/components/base/Label'
import ProgressBar from '@/components/base/ProgressBar'
import { getStudyById, getStudyValidatedEmissionsSources } from '@/db/study'
import { getAccountRoleOnStudy } from '@/utils/study'
import { Study } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Box from '../../base/Box'
import LinkButton from '../../base/LinkButton'
import GlossaryIconModal from '../../modals/GlossaryIconModal'
import styles from './StudyCard.module.css'
import StudyName from './StudyName'

interface Props {
  study: Study
  user: UserSession
}

const StudyCard = async ({ study, user }: Props) => {
  const t = await getTranslations('study')
  const values = await getStudyValidatedEmissionsSources(study.id)
  const fullStudy = await getStudyById(study.id, user.organizationVersionId)

  if (!values || !fullStudy) {
    return null
  }

  const accountRoleOnStudy = fullStudy.contributors.some((contributor) => contributor.accountId === user.accountId)
    ? 'Contributor'
    : getAccountRoleOnStudy(user, fullStudy)

  if (!accountRoleOnStudy) {
    return null
  }
  const percent = values.validated ? Math.floor((values.validated / values.total) * 100) : 0

  return (
    <li data-testid="study" className="flex">
      <Box className={classNames(styles.card, 'flex-col grow')}>
        <div className="justify-center">
          <StudyName name={study.name} />
        </div>
        <div className="justify-center">
          <Label className={styles[accountRoleOnStudy.toLowerCase()]}>{t(`role.${accountRoleOnStudy}`)}</Label>
        </div>
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
              className="ml-2"
              iconLabel="information"
              label="study-card"
              tModal="study"
            >
              {t('validatedOnlyDescription')}
            </GlossaryIconModal>
          </p>
          <ProgressBar value={percent} barClass={`${styles.progressBar}${percent === 100 ? '-success' : ''}`} />
        </Box>
        <div className="justify-end">
          <LinkButton href={`/etudes/${study.id}${accountRoleOnStudy === 'Contributor' ? '/contributeur' : ''}`}>
            {t('see')}
          </LinkButton>
        </div>
      </Box>
    </li>
  )
}

export default StudyCard
