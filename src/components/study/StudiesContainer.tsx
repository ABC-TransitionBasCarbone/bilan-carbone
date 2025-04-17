import {
  getAllowedStudiesByUserAndOrganization,
  getExternalAllowedStudiesByUser,
  getAllowedStudiesByAccount } from '@/db/study'
import { default as CUTStudyHomeMessage } from '@/environments/cut/study/StudyHomeMessage'
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
}

const StudiesContainer = async ({ user, organizationVersionId, isCR }: Props) => {
  const t = await getTranslations('study')

  const studies = organizationVersionId
    ? await getAllowedStudiesByUserAndOrganization(user, organizationVersionId)
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

  const creationUrl = organizationVersionId ? `/organisations/${organizationVersionId}/etudes/creer` : '/etudes/creer'

  const canCreateStudy = !!user.level && !!user.organizationVersionId
  const mainStudyOrganizationVersionId = organizationVersionId ?? user.organizationVersionId

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
          canAddStudy={canCreateStudy && !isCR}
          creationUrl={creationUrl}
          user={user}
          collaborations={!organizationVersionId && isCR}
        />
      )}
      {!!collaborations.length && <Studies studies={collaborations} canAddStudy={false} user={user} collaborations />}
    </>
  ) : canCreateStudy && !isCR ? (
    <MUIBox component="section">
      <CUTStudyHomeMessage />
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
    </MUIBox>
  ) : null
}

export default StudiesContainer
