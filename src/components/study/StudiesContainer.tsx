import { getAllowedStudiesByUser, getAllowedStudiesByUserAndOrganization } from '@/db/study'
import AddIcon from '@mui/icons-material/Add'
import classNames from 'classnames'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Suspense } from 'react'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import ResultsContainerForUser from './results/ResultsContainerForUser'
import Studies from './Studies'
import styles from './StudiesContainer.module.css'

interface Props {
  user: User
  organizationId: string | null
}

const StudiesContainer = async ({ user, organizationId }: Props) => {
  const t = await getTranslations('study')

  const studies = organizationId
    ? await getAllowedStudiesByUserAndOrganization(user, organizationId)
    : await getAllowedStudiesByUser(user)

  const creationUrl = organizationId ? `/organisations/${organizationId}/etudes/creer` : '/etudes/creer'

  const canCreateStudy = !!user.level && !!user.organizationId

  return studies.length ? (
    <>
      {organizationId && (
        <Suspense>
          <ResultsContainerForUser user={user} mainStudyOrganizationId={organizationId} />
        </Suspense>
      )}
      <Studies studies={studies} canAddStudy={canCreateStudy} creationUrl={creationUrl} />
    </>
  ) : canCreateStudy ? (
    <div className="justify-center">
      <Box className={classNames(styles.firstStudyCard, 'flex-col align-center')}>
        <Image src="/img/orga.png" alt="cr.png" width={177} height={119} />
        <h5>{t('createFirstStudy')}</h5>
        <p>{t('firstStudyMessage')}</p>
        <LinkButton
          data-testid="new-organization"
          className={classNames(styles.linkButton, 'w100 justify-center mb1')}
          href={creationUrl}
        >
          <AddIcon />
          {t('createFirstStudy')}
        </LinkButton>
      </Box>
    </div>
  ) : null
}

export default StudiesContainer
