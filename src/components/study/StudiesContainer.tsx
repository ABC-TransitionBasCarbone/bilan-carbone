import { getOrganizationVersionById } from '@/db/organization'
import {
  getAllowedStudiesByAccount,
  getAllowedStudiesByUserAndOrganization,
  getExternalAllowedStudiesByUser,
} from '@/db/study'
import { canCreateAStudy } from '@/services/permissions/study'
import { hasActiveLicence } from '@/utils/organization'
import AddIcon from '@mui/icons-material/Add'
import { Box as MUIBox } from '@mui/material'
import { Study } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import Image from '../document/Image'
import ResultsContainerForUser from './results/ResultsContainerForUser'
import Studies from './Studies'
import styles from './StudiesContainer.module.css'

interface Props {
  user: UserSession
  organizationVersionId?: string
  isCR?: boolean
  simplified?: boolean
}

const StudiesContainer = async ({ user, organizationVersionId, isCR, simplified = false }: Props) => {
  const t = await getTranslations('study')

  const studies = organizationVersionId
    ? await getAllowedStudiesByUserAndOrganization(user, organizationVersionId, simplified)
    : isCR
      ? await getExternalAllowedStudiesByUser(user)
      : await getAllowedStudiesByAccount(user)

  const [orgaStudies, otherStudies] = studies.reduce(
    (res, study) => {
      res[study.organizationVersionId === user.organizationVersionId ? 0 : 1].push(study)
      return res
    },
    [[] as Study[], [] as Study[]],
  )

  const isOrgaHomePage = !organizationVersionId && !isCR
  const mainStudies = isOrgaHomePage ? orgaStudies : studies
  const collaborations = isOrgaHomePage ? otherStudies : []

  let creationUrl = organizationVersionId ? `/organisations/${organizationVersionId}/etudes/creer` : '/etudes/creer'

  if (simplified) {
    creationUrl += '?simplified=true'
  }

  const mainStudyOrganizationVersionId = organizationVersionId ?? user.organizationVersionId

  const organizationVersion = await getOrganizationVersionById(mainStudyOrganizationVersionId)
  const activeLicence = !!(organizationVersion && hasActiveLicence(organizationVersion))

  return studies.length ? (
    <>
      {mainStudyOrganizationVersionId && !isCR && (
        <Suspense>
          <ResultsContainerForUser user={user} mainStudyOrganizationVersionId={mainStudyOrganizationVersionId} />
        </Suspense>
      )}
      {!!mainStudies.length && (
        <Studies
          studies={mainStudies}
          canAddStudy={canCreateAStudy(user, simplified) && !isCR && activeLicence}
          creationUrl={creationUrl}
          user={user}
          collaborations={!organizationVersionId && isCR}
        />
      )}
      {!!collaborations.length && <Studies studies={collaborations} canAddStudy={false} user={user} collaborations />}
    </>
  ) : canCreateAStudy(user, simplified) && !isCR ? (
    <MUIBox component="section" className="mt1">
      <div className="justify-center">
        <Box className={classNames(styles.firstStudyCard, 'flex-col align-center')}>
          <Image src="/img/orga.png" alt="orga.png" width={177} height={119} />
          <h5>{t(simplified ? 'createFirstSimplifiedStudy' : 'createFirstStudy')}</h5>
          <p>{t(simplified ? 'firstSimplifiedStudyMessage' : 'firstStudyMessage')}</p>
          <LinkButton data-testid="new-study" className={classNames('w100 justify-center mb1')} href={creationUrl}>
            <AddIcon />
            {t(simplified ? 'createFirstSimplifiedStudy' : 'createFirstStudy')}
          </LinkButton>
        </Box>
      </div>
    </MUIBox>
  ) : null
}

export default StudiesContainer
