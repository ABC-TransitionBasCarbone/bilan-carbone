'use server'

import { StudyContributorRow } from '@/components/study/rights/StudyContributorsTable'
import { AccountWithUser, getAccountByEmailAndOrganizationVersionId, getAccountById } from '@/db/account'
import { prismaClient } from '@/db/client'
import { createDocument, deleteDocument } from '@/db/document'
import {
  getEmissionFactorsByIdsAndSource,
  getEmissionFactorsByImportedIdsAndVersion,
  getEmissionFactorsImportActiveVersion,
  getEmissionFactorVersionsBySource,
  getStudyEmissionFactorSources,
} from '@/db/emissionFactors'
import {
  getOrganizationVersionById,
  getOrganizationWithSitesById,
  OrganizationVersionWithOrganization,
} from '@/db/organization'
import {
  clearEmissionSourceEmissionFactor,
  countOrganizationStudiesFromOtherUsers,
  createContributorOnStudy,
  createStudy,
  createStudyEmissionSource,
  createStudyExport,
  createUserOnStudy,
  deleteAccountOnStudy,
  deleteContributor,
  deleteStudy,
  deleteStudyExport,
  downgradeStudyUserRoles,
  FullStudy,
  getStudiesFromSites,
  getStudyById,
  getStudyNameById,
  getStudySites,
  getUsersOnStudy,
  updateEmissionSourceEmissionFactor,
  updateStudy,
  updateStudyEmissionFactorVersion,
  updateStudyOpeningHours,
  updateStudySites,
  updateUserOnStudy,
} from '@/db/study'
import { addUser, getUserApplicationSettings, UserWithAccounts } from '@/db/user'
import { getUserByEmail } from '@/db/userImport'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { isAdmin } from '@/utils/user'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import {
  ControlMode,
  Document,
  EmissionFactor,
  EmissionFactorImportVersion,
  Export,
  Import,
  Prisma,
  Role,
  StudyEmissionSource,
  StudyRole,
  UserChecklist,
  UserStatus,
} from '@prisma/client'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '../auth'
import { allowedFlowFileTypes, isAllowedFileType } from '../file'
import { ALREADY_IN_STUDY, NOT_AUTHORIZED } from '../permissions/check'
import {
  canAccessFlowFromStudy,
  canAddContributorOnStudy,
  canAddRightOnStudy,
  canChangeDates,
  canChangeLevel,
  canChangeName,
  canChangeOpeningHours,
  canChangePublicStatus,
  canChangeResultsUnit,
  canChangeSites,
  canCreateStudy,
  canDeleteStudy,
  canEditStudyFlows,
  canUpgradeSourceVersion,
  isAdminOnStudyOrga,
} from '../permissions/study'
import { deleteFileFromBucket, uploadFileToBucket } from '../serverFunctions/scaleway'
import { checkLevel } from '../study'
import {
  ChangeStudyCinemaCommand,
  ChangeStudyDatesCommand,
  ChangeStudyLevelCommand,
  ChangeStudyNameCommand,
  ChangeStudyPublicStatusCommand,
  ChangeStudyResultsUnitCommand,
  ChangeStudySitesCommand,
  CreateStudyCommand,
  DeleteCommand,
  NewStudyContributorCommand,
  NewStudyRightCommand,
} from './study.command'
import { addUserChecklistItem, sendInvitation } from './user'

export const getStudy = async (studyId: string) => {
  const session = await auth()
  if (!studyId || !session || !session.user) {
    return null
  }
  const study = await getStudyById(studyId, session.user.organizationVersionId)
  if (!study || !hasAccessToStudy(session.user, study)) {
    return null
  }

  return study
}

export const createStudyCommand = async ({
  organizationVersionId,
  validator,
  sites,
  openingHoursHoliday,
  ...command
}: CreateStudyCommand): Promise<{ message: string; success: false } | { id: string; success: true }> => {
  const session = await auth()

  if (!session || !session.user) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const rights: Prisma.UserOnStudyCreateManyStudyInput[] = []
  if (validator === session.user.email) {
    rights.push({
      role: StudyRole.Validator,
      accountId: session.user.accountId,
    })
  } else {
    const accountValidator = await getAccountByEmailAndOrganizationVersionId(
      validator,
      session.user.organizationVersionId,
    )
    if (!accountValidator) {
      return { success: false, message: NOT_AUTHORIZED }
    }

    rights.push({
      role: isAdmin(session.user.role) ? StudyRole.Validator : StudyRole.Editor,
      accountId: session.user.accountId,
    })
    rights.push({
      role: StudyRole.Validator,
      accountId: accountValidator.id,
    })
  }

  const activeVersion = await getEmissionFactorsImportActiveVersion(Import.BaseEmpreinte)
  if (!activeVersion) {
    return { success: false, message: `noActiveVersion_${Import.BaseEmpreinte}` }
  }

  const studySites = sites.filter((site) => site.selected)
  const organizationVersion = await getOrganizationVersionById(organizationVersionId)
  if (!organizationVersion) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  if (
    studySites.some((site) =>
      organizationVersion.organization.sites.every((organizationSite) => organizationSite.id !== site.id),
    )
  ) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const userCAUnit = (await getUserApplicationSettings(session.user.accountId))?.caUnit
  const caUnit = CA_UNIT_VALUES[userCAUnit || defaultCAUnit]

  const mergedOpeningHours = [...Object.values(command.openingHours || {}), ...Object.values(openingHoursHoliday || {})]

  const study = {
    ...command,
    createdBy: { connect: { id: session.user.accountId } },
    organizationVersion: { connect: { id: organizationVersionId } },
    isPublic: command.isPublic === 'true',
    openingHours: {
      create: mergedOpeningHours,
    },
    allowedUsers: {
      createMany: { data: rights },
    },
    exports: {
      createMany: {
        data: Object.entries(command.exports)
          .filter(([, value]) => value)
          .map(([key, value]) => ({
            type: key as Export,
            control: value as ControlMode,
          })),
      },
    },
    sites: {
      createMany: {
        data: studySites
          .map((site) => {
            const organizationSite = organizationVersion.organization.sites.find(
              (organizationSite) => organizationSite.id === site.id,
            )
            if (!organizationSite) {
              return undefined
            }
            return {
              siteId: site.id,
              etp: site.etp || organizationSite.etp,
              ca: site.ca ? site.ca * caUnit : organizationSite.ca,
            }
          })
          .filter((site) => site !== undefined),
      },
    },
  } satisfies Prisma.StudyCreateInput

  if (!(await canCreateStudy(session.user.accountId, study, organizationVersionId))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  try {
    const createdStudy = await createStudy(study)
    addUserChecklistItem(UserChecklist.CreateFirstStudy)
    return { success: true, id: createdStudy.id }
  } catch (e) {
    console.error(e)
    return { success: false, message: 'default' }
  }
}

const getStudyRightsInformations = async (studyId: string) => {
  const session = await auth()
  if (!session || !session.user) {
    return null
  }

  const studyWithRights = await getStudyById(studyId, session.user.organizationVersionId)

  if (!studyWithRights) {
    return null
  }
  return { user: session.user, studyWithRights }
}

export const changeStudyPublicStatus = async ({ studyId, ...command }: ChangeStudyPublicStatusCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }
  if (!canChangePublicStatus(informations.user, informations.studyWithRights)) {
    return NOT_AUTHORIZED
  }
  await updateStudy(studyId, { isPublic: command.isPublic === 'true' })
}

export const changeStudyLevel = async ({ studyId, ...command }: ChangeStudyLevelCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!(await canChangeLevel(informations.user, informations.studyWithRights, command.level))) {
    return NOT_AUTHORIZED
  }
  await updateStudy(studyId, command)

  const usersOnStudy = await getUsersOnStudy(studyId)
  const accountsLevel = await prismaClient.account.findMany({
    where: { id: { in: usersOnStudy.map((account) => account.accountId) } },
    select: { id: true, user: { select: { level: true } } },
  })
  const accountsRoleToDowngrade = accountsLevel
    .filter((accountLevel) => !checkLevel(accountLevel.user.level, command.level))
    .map((accountLevel) => accountLevel.id)
  if (accountsRoleToDowngrade.length) {
    await downgradeStudyUserRoles(studyId, accountsRoleToDowngrade)
  }
}

export const changeStudyResultsUnit = async ({ studyId, ...command }: ChangeStudyResultsUnitCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!(await canChangeResultsUnit(informations.user, informations.studyWithRights))) {
    return NOT_AUTHORIZED
  }

  await updateStudy(studyId, command)
}

export const changeStudyDates = async ({ studyId, ...command }: ChangeStudyDatesCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!(await canChangeDates(informations.user, informations.studyWithRights))) {
    return NOT_AUTHORIZED
  }
  await updateStudy(studyId, command)
}

export const changeStudyName = async ({ studyId, ...command }: ChangeStudyNameCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!canChangeName(informations.user, informations.studyWithRights)) {
    return NOT_AUTHORIZED
  }

  await updateStudy(studyId, { name: command.name })
}

export const changeStudyCinema = async ({ studyId, ...command }: ChangeStudyCinemaCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }
  const { openingHours, openingHoursHoliday, ...updateData } = command

  if (!canChangeOpeningHours(informations.user, informations.studyWithRights)) {
    return NOT_AUTHORIZED
  }

  await updateStudyOpeningHours(openingHours, openingHoursHoliday)
  await updateStudy(studyId, updateData)
}

export const hasActivityData = async (
  studyId: string,
  deletedSites: ChangeStudySitesCommand['sites'],
  organizationVersionId: string,
) => {
  const study = await getStudyById(studyId, organizationVersionId)
  if (!study) {
    return false
  }
  const emissionSources = await Promise.all(deletedSites.map((site) => hasEmissionSources(study, site.id)))
  return emissionSources.some((emissionSource) => emissionSource)
}

export const hasEmissionSources = async (study: FullStudy, siteId: string) => {
  if (!study) {
    return false
  }

  const studySite = study.sites.find((site) => site.site.id === siteId)
  if (!studySite) {
    return false
  }

  const emissionSources = study.emissionSources.find((emissionSource) => emissionSource.studySite.id === studySite.id)
  if (!emissionSources) {
    return false
  }

  return true
}

export const changeStudySites = async (studyId: string, { organizationId, ...command }: ChangeStudySitesCommand) => {
  const [organization, session] = await Promise.all([getOrganizationWithSitesById(organizationId), auth()])

  if (!organization || !session) {
    return NOT_AUTHORIZED
  }

  const userCAUnit = (await getUserApplicationSettings(session.user.accountId))?.caUnit
  const caUnit = CA_UNIT_VALUES[userCAUnit || defaultCAUnit]

  const selectedSites = command.sites
    .filter((site) => site.selected)
    .map((site) => {
      const organizationSite = organization.sites.find((organizationSite) => organizationSite.id === site.id)
      if (!organizationSite) {
        return undefined
      }
      return {
        studyId,
        siteId: site.id,
        etp: site.etp || organizationSite.etp,
        ca: site.ca * caUnit || organizationSite.ca,
      }
    })
    .filter((site) => site !== undefined)
  if (
    selectedSites.some((site) => organization.sites.every((organizationSite) => organizationSite.id !== site.siteId))
  ) {
    return NOT_AUTHORIZED
  }

  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!canChangeSites(informations.user, informations.studyWithRights)) {
    return NOT_AUTHORIZED
  }

  const existingSites = await getStudySites(studyId)
  const deletedSiteIds = existingSites
    .filter((existingStudySite) => !selectedSites.find((studySite) => studySite.siteId === existingStudySite.siteId))
    .map((studySite) => studySite.id)
  await updateStudySites(studyId, selectedSites, deletedSiteIds)
}

export const changeStudyExports = async (studyId: string, type: Export, control: ControlMode | false) => {
  const [session, study] = await Promise.all([auth(), getStudy(studyId)])
  if (!session || !session.user || !study) {
    return NOT_AUTHORIZED
  }
  if (!hasEditionRights(getAccountRoleOnStudy(session.user, study))) {
    return NOT_AUTHORIZED
  }
  if (control === false) {
    return deleteStudyExport(studyId, type)
  }
  return createStudyExport(studyId, type, control)
}

const getOrCreateUserAndSendStudyInvite = async (
  email: string,
  study: FullStudy,
  organizationVersion: OrganizationVersionWithOrganization,
  creator: UserSession,
  existingUser: UserWithAccounts | null,
  existingAccount: AccountWithUser | null,
  role?: StudyRole,
) => {
  let accountId = ''
  const t = await getTranslations('study.role')

  if (!existingUser) {
    const newUser = await addUser({
      email: email,
      status: UserStatus.VALIDATED,
      firstName: '',
      lastName: '',
      accounts: {
        create: {
          role: Role.COLLABORATOR,
          organizationVersionId: organizationVersion.id,
        },
      },
    })

    await sendInvitation(email, study, organizationVersion.organization, creator, role ? t(role).toLowerCase() : '')

    accountId = newUser.accounts[0].id
  } else {
    // TODO récupérer le bon account
    const account = (await getAccountById(existingUser.accounts[0].id)) as AccountWithUser
    await sendInvitation(
      email,
      study,
      organizationVersion.organization,
      creator,
      role ? t(role).toLowerCase() : '',
      account,
    )
    accountId = account.id
  }

  return accountId
}

export const newStudyRight = async (right: NewStudyRightCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, existingAccount, existingUser] = await Promise.all([
    getStudyById(right.studyId, session.user.organizationVersionId),
    getAccountByEmailAndOrganizationVersionId(right.email, session.user.organizationVersionId),
    getUserByEmail(right.email),
  ])

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  if (!existingUser || !checkLevel(existingUser.level, studyWithRights.level)) {
    right.role = StudyRole.Reader
  }

  if (!canAddRightOnStudy(session.user, studyWithRights, existingUser, right.role)) {
    return NOT_AUTHORIZED
  }

  const organizationVersion = await getOrganizationVersionById(studyWithRights.organizationVersionId)
  if (!organizationVersion) {
    return NOT_AUTHORIZED
  }

  if (
    studyWithRights.allowedUsers.some((allowedUser) => allowedUser.accountId === existingAccount?.id) ||
    studyWithRights.contributors.some((contributor) => contributor.accountId === existingAccount?.id)
  ) {
    return ALREADY_IN_STUDY
  }

  if (
    existingAccount &&
    isAdminOnStudyOrga(
      accountWithUserToUserSession(existingAccount as AccountWithUser),
      studyWithRights.organizationVersion as OrganizationVersionWithOrganization,
    ) &&
    checkLevel(existingAccount.user.level, studyWithRights.level)
  ) {
    right.role = StudyRole.Validator
  }

  const accountId = await getOrCreateUserAndSendStudyInvite(
    right.email,
    studyWithRights,
    organizationVersion as OrganizationVersionWithOrganization,
    session.user,
    existingUser,
    existingAccount as AccountWithUser,
    right.role,
  )

  await createUserOnStudy({
    account: { connect: { id: accountId } },
    study: { connect: { id: studyWithRights.id } },
    role: right.role,
  })
}

export const changeStudyRole = async (studyId: string, email: string, studyRole: StudyRole) => {
  const session = await auth()
  if (!session || !session.user || !session.user.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, existingAccount, existingUser] = await Promise.all([
    getStudyById(studyId, session.user.organizationVersionId),
    getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId),
    getUserByEmail(email),
  ])

  if (!studyWithRights || !existingAccount) {
    return NOT_AUTHORIZED
  }

  if (!canAddRightOnStudy(session.user, studyWithRights, existingUser, studyRole)) {
    return NOT_AUTHORIZED
  }

  if (
    existingAccount &&
    isAdminOnStudyOrga(
      accountWithUserToUserSession(existingAccount as AccountWithUser),
      studyWithRights.organizationVersion as OrganizationVersionWithOrganization,
    ) &&
    studyRole !== StudyRole.Validator
  ) {
    return NOT_AUTHORIZED
  }

  if (
    existingAccount &&
    !checkLevel(existingAccount.user.level, studyWithRights.level) &&
    studyRole !== StudyRole.Reader
  ) {
    return NOT_AUTHORIZED
  }

  await updateUserOnStudy(existingAccount.id, studyWithRights.id, studyRole)
}

export const newStudyContributor = async ({ email, subPosts, ...command }: NewStudyContributorCommand) => {
  const session = await auth()
  if (!session || !session.user || !session.user.organizationVersionId) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, existingAccount, existingUser] = await Promise.all([
    getStudyById(command.studyId, session.user.organizationVersionId),
    getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId),
    getUserByEmail(email),
  ])

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  const organizationVersion = await getOrganizationVersionById(studyWithRights.organizationVersionId)
  if (!organizationVersion) {
    return NOT_AUTHORIZED
  }

  if (!canAddContributorOnStudy(session.user, studyWithRights)) {
    return NOT_AUTHORIZED
  }

  if (
    existingAccount &&
    getAccountRoleOnStudy(accountWithUserToUserSession(existingAccount as AccountWithUser), studyWithRights)
  ) {
    return ALREADY_IN_STUDY
  }

  const accountId = await getOrCreateUserAndSendStudyInvite(
    email,
    studyWithRights,
    organizationVersion as OrganizationVersionWithOrganization,
    session.user,
    existingUser,
    existingAccount as AccountWithUser,
  )

  const selectedSubposts = Object.values(subPosts).reduce((res, subPosts) => res.concat(subPosts), [])
  await createContributorOnStudy(accountId, selectedSubposts, command)
}

export const deleteStudyCommand = async ({ id, name }: DeleteCommand) => {
  if (!(await canDeleteStudy(id))) {
    return NOT_AUTHORIZED
  }
  const studyName = await getStudyNameById(id)
  if (!studyName) {
    return NOT_AUTHORIZED
  }

  if (studyName.toLowerCase() !== name.toLowerCase()) {
    return 'wrongName'
  }
  await deleteStudy(id)
}

export const addFlowToStudy = async (studyId: string, file: File) => {
  const session = await auth()
  const allowedType = await isAllowedFileType(file, allowedFlowFileTypes)
  if (!allowedType) {
    return 'invalidFileType'
  }
  const allowedUserId = await canEditStudyFlows(studyId)
  if (!allowedUserId) {
    return NOT_AUTHORIZED
  }
  const butcketUploadResult = await uploadFileToBucket(file)
  await createDocument({
    name: file.name,
    type: file.type,
    uploader: { connect: { id: session?.user.accountId } },
    study: { connect: { id: studyId } },
    bucketKey: butcketUploadResult.key,
    bucketETag: butcketUploadResult.ETag || '',
  })
}

export const deleteFlowFromStudy = async (document: Document, studyId: string) => {
  if (!(await canAccessFlowFromStudy(document.id, studyId)) || !(await canEditStudyFlows(studyId))) {
    return NOT_AUTHORIZED
  }
  const bucketDelete = await deleteFileFromBucket(document.bucketKey)
  if (bucketDelete) {
    await deleteDocument(document.id)
  }
}

const hasAccessToStudy = (user: UserSession, study: AsyncReturnType<typeof getStudiesFromSites>[0]['study']) => {
  // The function does not return the user's role, which is sensitive information.
  // We don't need to know the role, only whether or not the user has one
  // We therefore arbitrarily use the "Reader" role
  const allowedUsers = study.allowedUsers.map(({ accountId }) => ({
    account: { id: accountId, user: { id: user.userId } },
    role: StudyRole.Reader,
  }))
  const studyObject = { ...study, allowedUsers: allowedUsers }
  return (
    getAccountRoleOnStudy(user, studyObject as FullStudy) ||
    study.contributors.some((contributor) => contributor.accountId === user.accountId)
  )
}

export const findStudiesWithSites = async (siteIds: string[]) => {
  const [session, studySites] = await Promise.all([auth(), getStudiesFromSites(siteIds)])

  const user = session?.user
  const authorizedStudySites: AsyncReturnType<typeof getStudiesFromSites> = []
  const unauthorizedStudySites: (Pick<AsyncReturnType<typeof getStudiesFromSites>[0], 'site' | 'study'> & {
    count: number
  })[] = []

  studySites.forEach((studySite) => {
    if (user && hasAccessToStudy(user, studySite.study)) {
      authorizedStudySites.push(studySite)
    } else {
      const targetedSite = unauthorizedStudySites.find(
        (unauthorizedStudySite) =>
          unauthorizedStudySite.site.name === studySite.site.name &&
          unauthorizedStudySite.site.organization.id === studySite.site.organization.id,
      )
      if (!targetedSite) {
        unauthorizedStudySites.push({ site: studySite.site, study: studySite.study, count: 1 })
      } else {
        targetedSite.count++
      }
    }
  })

  return {
    authorizedStudySites,
    unauthorizedStudySites,
  }
}

export const deleteStudyMember = async (member: FullStudy['allowedUsers'][0], studyId: string) => {
  const [session, study] = await Promise.all([auth(), getStudy(studyId)])
  if (!session?.user || !study || !hasEditionRights(getAccountRoleOnStudy(session.user, study))) {
    return NOT_AUTHORIZED
  }

  await deleteAccountOnStudy(studyId, member.accountId)
}

export const deleteStudyContributor = async (contributor: StudyContributorRow, studyId: string) => {
  const [session, study] = await Promise.all([auth(), getStudy(studyId)])
  if (!session?.user || !study || !hasEditionRights(getAccountRoleOnStudy(session.user, study))) {
    return NOT_AUTHORIZED
  }
  await deleteContributor(studyId, contributor)
}

export const getStudyEmissionFactorImportVersions = async (studyId: string) => {
  const study = await getStudy(studyId)
  if (!study) {
    return []
  }
  return getStudyEmissionFactorSources(studyId)
}

export const getOrganizationStudiesFromOtherUsers = async (organizationVersionId: string, accountId: string) =>
  countOrganizationStudiesFromOtherUsers(organizationVersionId, accountId)

const getMetaData = (emissionFactor: AsyncReturnType<typeof getEmissionFactorsByIdsAndSource>[0], locale: LocaleType) =>
  emissionFactor.metaData.find((metadata) => metadata.language === locale) ?? emissionFactor.metaData[0]

export const simulateStudyEmissionFactorSourceUpgrade = async (studyId: string, source: Import) => {
  const [session, study, importVersions, locale] = await Promise.all([
    auth(),
    getStudyById(studyId, null),
    getEmissionFactorVersionsBySource(source),
    getLocale(),
  ])
  if (!session || !session.user || !study || !importVersions.length) {
    return { success: false }
  }

  if (!(await canUpgradeSourceVersion(session.user, study))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const latestSourceVersion = importVersions[0]
  if (
    latestSourceVersion.id ===
    study.emissionFactorVersions.find((version) => version.source === source)?.importVersionId
  ) {
    return { success: false, message: 'latest' }
  }

  const targetedEmissionSources = study.emissionSources.filter(
    (emissionSource) => emissionSource.emissionFactor?.importedFrom === source,
  )
  const emissionFactors = await getEmissionFactorsByIdsAndSource(
    targetedEmissionSources.map((emissionSource) => emissionSource.emissionFactorId).filter((id) => id !== null),
    source,
  )
  const upgradedEmissionFactors = await getEmissionFactorsByImportedIdsAndVersion(
    emissionFactors.map((emissionFactor) => emissionFactor.importedId).filter((importedId) => importedId !== null),
    latestSourceVersion.id,
  )

  const deletedEmissionFactors = emissionFactors
    .filter(
      (emissionFactor) =>
        !upgradedEmissionFactors
          .map((upgradedEmissionFactor) => upgradedEmissionFactor.importedId)
          .includes(emissionFactor.importedId),
    )
    .map((emissionFactor) => ({
      ...emissionFactor,
      metaData: getMetaData(emissionFactor, locale),
    }))

  const updatedEmissionFactors = emissionFactors
    .filter((emissionFactor) => {
      const upgradedVersion = upgradedEmissionFactors.find(
        (upgradedEmissionFactor) => upgradedEmissionFactor.importedId === emissionFactor.importedId,
      )
      return upgradedVersion && upgradedVersion.totalCo2 !== emissionFactor.totalCo2
    })
    .map((emissionFactor) => ({
      ...emissionFactor,
      metaData: getMetaData(emissionFactor, locale),
      newValue: (
        upgradedEmissionFactors.find(
          (upgradedEmissionFactor) => upgradedEmissionFactor.importedId === emissionFactor.importedId,
        ) as EmissionFactor
      ).totalCo2,
    }))

  return {
    success: true,
    emissionSources: targetedEmissionSources,
    deleted: deletedEmissionFactors,
    updated: updatedEmissionFactors,
    latestSourceVersion,
  }
}

export const upgradeStudyEmissionFactorSource = async (studyId: string, source: Import) => {
  const simulationResults = await simulateStudyEmissionFactorSourceUpgrade(studyId, source)
  if (!simulationResults.success) {
    return simulationResults
  }

  const importedIds = (simulationResults.emissionSources || [])
    .map((emissionSource) => emissionSource.emissionFactor?.importedId)
    .filter((importId) => importId !== null && importId !== undefined)

  const upgradedEmissionFactors = await getEmissionFactorsByImportedIdsAndVersion(
    importedIds,
    (simulationResults.latestSourceVersion as EmissionFactorImportVersion).id,
  )

  const updatePromises = (simulationResults.emissionSources || []).reduce((promises, emissionSource) => {
    const newEmissionFactor = (upgradedEmissionFactors || []).find(
      (emissionFactor) => emissionFactor.importedId === emissionSource.emissionFactor?.importedId,
    )
    return promises.concat(
      newEmissionFactor ? [updateEmissionSourceEmissionFactor(emissionSource.id, newEmissionFactor.id)] : [],
    )
  }, [] as Prisma.PrismaPromise<StudyEmissionSource>[])
  const deletePromises = (simulationResults.deleted || []).reduce((promises, emissionFactor) => {
    const emissionSources =
      simulationResults.emissionSources?.filter(
        (emissionSource) => emissionSource.emissionFactor?.id === emissionFactor.id,
      ) || []
    return promises.concat(
      emissionSources.map((emissionSource) => clearEmissionSourceEmissionFactor(emissionSource.id)),
    )
  }, [] as Prisma.PrismaPromise<StudyEmissionSource>[])
  await Promise.all(updatePromises.concat(deletePromises))

  await updateStudyEmissionFactorVersion(studyId, source, simulationResults.latestSourceVersion?.id)

  return { success: true }
}

export const duplicateStudyEmissionSource = async (
  studyId: string,
  emissionSource: FullStudy['emissionSources'][0],
  studySite: string,
) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }
  const study = await getStudyById(studyId, session.user.organizationVersionId)

  if (
    !study ||
    !getAccountRoleOnStudy(session.user, study) ||
    !hasEditionRights(getAccountRoleOnStudy(session.user, study))
  ) {
    return NOT_AUTHORIZED
  }

  const data = {
    ...emissionSource,
    id: uuidv4(),
    study: { connect: { id: studyId } },
    emissionFactor: emissionSource.emissionFactor ? { connect: { id: emissionSource.emissionFactor.id } } : undefined,
    emissionFactorId: undefined,
    contributor: emissionSource.contributor ? { connect: { id: emissionSource.contributor.id } } : undefined,
    contributorId: undefined,
    studySite: { connect: { id: studySite } },
    studySiteId: undefined,
    validated: false,
  } as Prisma.StudyEmissionSourceCreateInput

  await createStudyEmissionSource(data)
}
