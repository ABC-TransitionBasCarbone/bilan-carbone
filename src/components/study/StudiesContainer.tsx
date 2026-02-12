import { getOrganizationVersionForRightsCheck } from '@/db/organization'
import {
  StudyCardItem,
  getAllowedStudiesByAccount,
  getAllowedStudiesByUserAndOrganization,
  getExternalAllowedStudiesByUser,
  getStudiesForCards,
  getStudiesValidatedEmissionsSources,
} from '@/db/study'
import { customRich } from '@/i18n/customRich'
import { isTilt, isTiltSimplifiedFeatureActive } from '@/services/permissions/environment'
import { canCreateAStudy } from '@/services/permissions/study'
import { hasActiveLicence } from '@/utils/organization'
import AddIcon from '@mui/icons-material/Add'
import { Alert, Box as MUIBox } from '@mui/material'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Block from '../base/Block'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import Image from '../document/Image'
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

  const allowedStudies = organizationVersionId
    ? await getAllowedStudiesByUserAndOrganization(user, organizationVersionId, simplified)
    : isCR
      ? await getExternalAllowedStudiesByUser(user)
      : await getAllowedStudiesByAccount(user)

  const allowedStudyIds = allowedStudies.map((study) => study.id)

  const mainStudyOrganizationVersionId = organizationVersionId ?? user.organizationVersionId

  const [organizationVersion, studiesForCards, studiesValidatedSources] = await Promise.all([
    getOrganizationVersionForRightsCheck(mainStudyOrganizationVersionId),
    getStudiesForCards(allowedStudyIds),
    getStudiesValidatedEmissionsSources(allowedStudyIds),
  ])

  const studies = allowedStudyIds
    .map((studyId) => {
      const card = studiesForCards[studyId]
      if (!card) {
        return null
      }
      return { ...card, validatedSources: studiesValidatedSources[studyId] }
    })
    .filter((c): c is StudyCardItem => c !== null)

  const isOrgaHomePage = !organizationVersionId && !isCR
  const [orgaStudies, otherStudies] = isOrgaHomePage
    ? studies.reduce(
        (res, study) => {
          res[study.organizationVersion.id === user.organizationVersionId ? 0 : 1].push(study)
          return res
        },
        [[] as StudyCardItem[], [] as StudyCardItem[]],
      )
    : [studies, [] as StudyCardItem[]]

  const mainStudies = isOrgaHomePage ? orgaStudies : studies
  const collaborationStudies = isOrgaHomePage ? otherStudies : []
  const advancedStudies = mainStudies.filter((study) => !study.simplified)
  const simplifiedStudies = mainStudies.filter((study) => study.simplified)

  const creationUrl = organizationVersionId ? `/organisations/${organizationVersionId}/etudes/creer` : '/etudes/creer'
  const creationUrlSimplified = `${creationUrl}?simplified=true`

  const activeLicence = !!(organizationVersion && hasActiveLicence(organizationVersion))

  let displaySimplifiedStudies = false
  let hasStudies = studies.length > 0
  if (!isTilt(user.environment)) {
    displaySimplifiedStudies = true
  } else {
    displaySimplifiedStudies = await isTiltSimplifiedFeatureActive(user.environment)
    if (!displaySimplifiedStudies) {
      hasStudies = advancedStudies.length > 0
    }
  }

  return hasStudies ? (
    <>
      {!!advancedStudies.length && (
        <Studies
          studies={advancedStudies}
          canAddStudy={(await canCreateAStudy(user)) && !isCR && activeLicence}
          creationUrl={creationUrl}
          user={user}
          collaborations={!organizationVersionId && isCR}
        />
      )}

      {displaySimplifiedStudies && !!simplifiedStudies.length && (
        <Studies
          studies={simplifiedStudies}
          canAddStudy={(await canCreateAStudy(user, true)) && !isCR && activeLicence}
          creationUrl={creationUrlSimplified}
          user={user}
          collaborations={!organizationVersionId && isCR}
          simplified
        />
      )}
      {!!collaborationStudies.length && (
        <Studies studies={collaborationStudies} canAddStudy={false} user={user} collaborations />
      )}
    </>
  ) : (await canCreateAStudy(user, simplified)) ? (
    !isCR && (
      <MUIBox component="section" className="mt1">
        <div className="justify-center">
          <Box className={classNames(styles.firstStudyCard, 'flex-col align-center')}>
            <Image src="/img/orga.png" alt="orga.png" width={177} height={119} />
            <h5>{t(simplified ? 'createFirstSimplifiedStudy' : 'createFirstStudy')}</h5>
            <p>{t(simplified ? 'firstSimplifiedStudyMessage' : 'firstStudyMessage')}</p>
            <LinkButton
              data-testid="new-study"
              className={classNames('w100 justify-center mb1')}
              href={simplified ? creationUrlSimplified : creationUrl}
            >
              <AddIcon />
              {t(simplified ? 'createFirstSimplifiedStudy' : 'createFirstStudy')}
            </LinkButton>
          </Box>
        </div>
      </MUIBox>
    )
  ) : (
    <Block>
      <Alert className="p0" severity="info">
        <p>
          {customRich(t, 'cannotCreateStudy', {
            link: (children) => <Link href="/ressources">{children}</Link>,
          })}
        </p>
        <p>
          {customRich(t, 'canCreateFootPrint', {
            link: (children) => <Link href="/mes-empreintes">{children}</Link>,
          })}
        </p>
      </Alert>
    </Block>
  )
}

export default StudiesContainer
