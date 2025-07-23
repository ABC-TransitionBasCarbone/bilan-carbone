'use server'

import { StudyContributorDeleteParams } from '@/components/study/rights/StudyContributorsTable'
import { defaultEmissionSourceTags } from '@/constants/emissionSourceTags'
import {
  AccountWithUser,
  addAccount,
  getAccountByEmailAndEnvironment,
  getAccountByEmailAndOrganizationVersionId,
  getAccountsUserLevel,
} from '@/db/account'
import { findCncByNumeroAuto } from '@/db/cnc'
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
  getStudiesSitesFromIds,
  getStudyById,
  getStudyNameById,
  getStudySites,
  getUsersOnStudy,
  updateEmissionSourceEmissionFactor,
  updateStudy,
  updateStudyEmissionFactorVersion,
  updateStudyOpeningHours,
  updateStudySiteData,
  updateStudySites,
  updateUserOnStudy,
} from '@/db/study'
import { addUser, getUserApplicationSettings, getUserByEmail, getUserSourceById, UserWithAccounts } from '@/db/user'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { withServerResponse } from '@/utils/serverResponse'
import {
  getAccountRoleOnStudy,
  getAllowedRolesFromDefaultRole,
  getUserRoleOnPublicStudy,
  hasEditionRights,
} from '@/utils/study'
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
  StudyResultUnit,
  StudyRole,
  SubPost,
  UserChecklist,
  UserStatus,
} from '@prisma/client'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { v4 as uuidv4 } from 'uuid'
import { auth, dbActualizedAuth } from '../auth'
import { allowedFlowFileTypes, isAllowedFileType } from '../file'
import { ALREADY_IN_STUDY, NOT_AUTHORIZED } from '../permissions/check'
import { isInOrgaOrParentFromId } from '../permissions/organization'
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
  canCreateSpecificStudy,
  canDeleteStudy,
  canDuplicateStudy,
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

export const getStudy = async (studyId: string) =>
  withServerResponse('getStudy', async () => {
    const session = await dbActualizedAuth()
    if (!studyId || !session || !session.user) {
      return null
    }
    const study = await getStudyById(studyId, session.user.organizationVersionId)
    if (!study || !hasAccessToStudy(session.user, study)) {
      return null
    }

    return study
  })

export const getStudySite = async (studySiteId: string) =>
  withServerResponse('getStudySite', async () => {
    const session = await dbActualizedAuth()
    if (!studySiteId || !session || !session.user) {
      return null
    }

    const studySites = await getStudiesSitesFromIds([studySiteId])

    if (!studySites || studySites.length === 0) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studySites[0].studyId, session.user.organizationVersionId)
    if (!study || !hasAccessToStudy(session.user, study)) {
      return null
    }

    return study.sites.find((site) => site.id === studySiteId)
  })

export const createStudyCommand = async (
  { organizationVersionId, validator, sites, ...command }: CreateStudyCommand,
  resultsUnit?: StudyResultUnit,
) =>
  withServerResponse('createStudyCommand', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
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
        throw new Error(NOT_AUTHORIZED)
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
      throw new Error(`noActiveVersion_${Import.BaseEmpreinte}`)
    }

    const studySites = sites.filter((site) => site.selected)
    const organizationVersion = await getOrganizationVersionById(organizationVersionId)
    if (!organizationVersion) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      studySites.some((site) =>
        organizationVersion.organization.sites.every((organizationSite) => organizationSite.id !== site.id),
      )
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const userCAUnit = (await getUserApplicationSettings(session.user.accountId))?.caUnit
    const caUnit = CA_UNIT_VALUES[userCAUnit || defaultCAUnit]

    const emissionSourceTags = {
      createMany: {
        data:
          session.user.environment in defaultEmissionSourceTags
            ? defaultEmissionSourceTags[session.user.environment as keyof typeof defaultEmissionSourceTags]
            : [],
      },
    }

    const study = {
      ...command,
      createdBy: { connect: { id: session.user.accountId } },
      organizationVersion: { connect: { id: organizationVersionId } },
      isPublic: command.isPublic === 'true',
      resultsUnit: resultsUnit || StudyResultUnit.T,
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
                volunteerNumber: site.volunteerNumber || organizationSite.volunteerNumber,
                beneficiaryNumber: site.beneficiaryNumber || organizationSite.beneficiaryNumber,
              }
            })
            .filter((site) => site !== undefined),
        },
      },
      emissionSourceTags,
    } satisfies Prisma.StudyCreateInput

    if (!(await canCreateSpecificStudy(session.user, study, organizationVersionId))) {
      throw new Error(NOT_AUTHORIZED)
    }

    try {
      const createdStudy = await createStudy(study, session.user.environment)
      addUserChecklistItem(UserChecklist.CreateFirstStudy)
      return { id: createdStudy.id }
    } catch (e) {
      console.error(e)
      throw new Error('default')
    }
  })

const getStudyRightsInformations = async (studyId: string) => {
  const session = await dbActualizedAuth()
  if (!session || !session.user) {
    return null
  }

  const studyWithRights = await getStudyById(studyId, session.user.organizationVersionId)

  if (!studyWithRights) {
    return null
  }
  return { user: session.user, studyWithRights }
}

export const changeStudyPublicStatus = async ({ studyId, ...command }: ChangeStudyPublicStatusCommand) =>
  withServerResponse('changeStudyPublicStatus', async () => {
    const informations = await getStudyRightsInformations(studyId)
    if (informations === null) {
      throw new Error(NOT_AUTHORIZED)
    }
    if (!canChangePublicStatus(informations.user, informations.studyWithRights)) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateStudy(studyId, { isPublic: command.isPublic === 'true' })
  })

export const changeStudyLevel = async ({ studyId, ...command }: ChangeStudyLevelCommand) =>
  withServerResponse('changeStudyLevel', async () => {
    const informations = await getStudyRightsInformations(studyId)
    if (informations === null) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canChangeLevel(informations.user, informations.studyWithRights, command.level))) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateStudy(studyId, command)

    const usersOnStudy = await getUsersOnStudy(studyId)
    const accountsLevel = await getAccountsUserLevel(usersOnStudy.map((account) => account.accountId))
    const accountsRoleToDowngrade = accountsLevel
      .filter((accountLevel) => !checkLevel(accountLevel.user.level, command.level))
      .map((accountLevel) => accountLevel.id)
    if (accountsRoleToDowngrade.length) {
      await downgradeStudyUserRoles(studyId, accountsRoleToDowngrade)
    }
  })

export const changeStudyResultsUnit = async ({ studyId, ...command }: ChangeStudyResultsUnitCommand) =>
  withServerResponse('changeStudyResultsUnit', async () => {
    const informations = await getStudyRightsInformations(studyId)
    if (informations === null) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canChangeResultsUnit(informations.user, informations.studyWithRights))) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateStudy(studyId, command)
  })

export const changeStudyDates = async ({ studyId, ...command }: ChangeStudyDatesCommand) =>
  withServerResponse('changeStudyDates', async () => {
    const informations = await getStudyRightsInformations(studyId)
    if (informations === null) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canChangeDates(informations.user, informations.studyWithRights))) {
      throw new Error(NOT_AUTHORIZED)
    }
    await updateStudy(studyId, command)
  })

export const changeStudyName = async ({ studyId, ...command }: ChangeStudyNameCommand) =>
  withServerResponse('changeStudyName', async () => {
    const informations = await getStudyRightsInformations(studyId)
    if (informations === null) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canChangeName(informations.user, informations.studyWithRights)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateStudy(studyId, { name: command.name })
  })

export const changeStudyCinema = async (studySiteId: string, data: ChangeStudyCinemaCommand) =>
  withServerResponse('changeStudyCinema', async () => {
    const studySites = await getStudiesSitesFromIds([studySiteId])

    if (!studySites || studySites.length === 0) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = studySites[0].study

    if (!study) {
      throw new Error(NOT_AUTHORIZED)
    }

    const informations = await getStudyRightsInformations(study.id)

    if (informations === null) {
      throw new Error(NOT_AUTHORIZED)
    }
    const { openingHours, openingHoursHoliday, ...updateData } = data

    if (!canChangeOpeningHours(informations.user, informations.studyWithRights)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await updateStudyOpeningHours(studySiteId, openingHours, openingHoursHoliday)
    await updateStudySiteData(studySiteId, updateData)
  })

export const hasActivityData = async (
  studyId: string,
  deletedSites: ChangeStudySitesCommand['sites'],
  organizationVersionId: string,
) =>
  withServerResponse('hasActivityData', async () => {
    const study = await getStudyById(studyId, organizationVersionId)
    if (!study) {
      return false
    }
    const emissionSources = await Promise.all(deletedSites.map((site) => hasEmissionSources(study, site.id)))
    return emissionSources.some((emissionSource) => emissionSource)
  })

const hasEmissionSources = async (study: FullStudy, siteId: string) => {
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

export const changeStudySites = async (studyId: string, { organizationId, ...command }: ChangeStudySitesCommand) =>
  withServerResponse('changeStudySites', async () => {
    const [organization, session] = await Promise.all([
      getOrganizationWithSitesById(organizationId),
      dbActualizedAuth(),
    ])

    if (!organization || !session) {
      throw new Error(NOT_AUTHORIZED)
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
          ca: (site?.ca || 0) * caUnit || organizationSite.ca,
          volunteerNumber: site.volunteerNumber || organizationSite.volunteerNumber,
          beneficiaryNumber: site.beneficiaryNumber || organizationSite.beneficiaryNumber,
        }
      })
      .filter((site) => site !== undefined)
    if (
      selectedSites.some((site) => organization.sites.every((organizationSite) => organizationSite.id !== site.siteId))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const informations = await getStudyRightsInformations(studyId)
    if (informations === null) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canChangeSites(informations.user, informations.studyWithRights)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const existingSites = await getStudySites(studyId)
    const deletedSiteIds = existingSites
      .filter((existingStudySite) => !selectedSites.find((studySite) => studySite.siteId === existingStudySite.siteId))
      .map((studySite) => studySite.id)
    await updateStudySites(studyId, selectedSites, deletedSiteIds)
  })

export const changeStudyExports = async (studyId: string, type: Export, control: ControlMode | false) =>
  withServerResponse('changeStudyExports', async () => {
    const [session, study] = await Promise.all([dbActualizedAuth(), getStudy(studyId)])
    if (!session || !session.user || !study.success || !study.data) {
      throw new Error(NOT_AUTHORIZED)
    }
    if (!hasEditionRights(getAccountRoleOnStudy(session.user, study.data))) {
      throw new Error(NOT_AUTHORIZED)
    }
    if (control === false) {
      return deleteStudyExport(studyId, type)
    }
    return createStudyExport(studyId, type, control)
  })

const getOrCreateUserAndSendStudyInvite = async (
  email: string,
  study: FullStudy,
  organizationVersion: OrganizationVersionWithOrganization,
  creator: UserSession,
  existingUser: UserWithAccounts | null,
  newRoleOnStudy?: StudyRole,
  skipInviteEmail = false,
) => {
  let accountId = ''
  const t = await getTranslations('study.role')
  const creatorDBUser = await getUserSourceById(creator.id)

  if (!existingUser) {
    const newUser = await addUser({
      email: email,
      firstName: '',
      lastName: '',
      source: creatorDBUser?.source,
      accounts: {
        create: {
          status: UserStatus.VALIDATED,
          role: Role.DEFAULT,
          environment: study.organizationVersion.environment,
        },
      },
    })

    if (!skipInviteEmail) {
      await sendInvitation(
        email,
        study,
        organizationVersion.organization,
        creator,
        newRoleOnStudy ? t(newRoleOnStudy).toLowerCase() : '',
        study.organizationVersion.environment,
      )
    }

    const newAccountId = newUser.accounts.find((a) => a.environment === organizationVersion.environment)?.id
    if (!newAccountId) {
      throw new Error()
    }

    accountId = newAccountId
  } else {
    let account = (await getAccountByEmailAndEnvironment(email, organizationVersion.environment)) as AccountWithUser

    if (!account) {
      account = (await addAccount({
        user: { connect: { id: existingUser.id } },
        role: Role.COLLABORATOR,
        environment: organizationVersion.environment,
        status: UserStatus.VALIDATED,
      })) as AccountWithUser
    }

    if (!skipInviteEmail) {
      await sendInvitation(
        email,
        study,
        organizationVersion.organization,
        creator,
        newRoleOnStudy ? t(newRoleOnStudy).toLowerCase() : '',
        organizationVersion.environment,
        account,
      )
    }
    accountId = account.id
  }

  return accountId
}

export const newStudyRight = async (right: NewStudyRightCommand) =>
  withServerResponse('newStudyRight', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [studyWithRights, existingAccount, existingUser] = await Promise.all([
      getStudyById(right.studyId, session.user.organizationVersionId),
      getAccountByEmailAndOrganizationVersionId(right.email, session.user.organizationVersionId),
      getUserByEmail(right.email),
    ])

    if (!studyWithRights) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!existingUser || !checkLevel(existingUser.level, studyWithRights.level)) {
      right.role = StudyRole.Reader
    }

    if (!canAddRightOnStudy(session.user, studyWithRights, existingUser, right.role)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const organizationVersion = await getOrganizationVersionById(studyWithRights.organizationVersionId)
    if (!organizationVersion) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      studyWithRights.allowedUsers.some((allowedUser) => allowedUser.accountId === existingAccount?.id) ||
      studyWithRights.contributors.some((contributor) => contributor.accountId === existingAccount?.id)
    ) {
      throw new Error(ALREADY_IN_STUDY)
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

    if (
      existingAccount &&
      existingUser &&
      studyWithRights.isPublic &&
      (await isInOrgaOrParentFromId(existingAccount.organizationVersionId, studyWithRights.organizationVersionId))
    ) {
      const defaultRole = getUserRoleOnPublicStudy(
        { role: existingAccount.role, level: existingUser?.level, environment: existingAccount.environment },
        studyWithRights.level,
      )
      if (!getAllowedRolesFromDefaultRole(defaultRole).includes(right.role)) {
        right.role = defaultRole
      }
    }

    const accountId = await getOrCreateUserAndSendStudyInvite(
      right.email,
      studyWithRights,
      organizationVersion as OrganizationVersionWithOrganization,
      session.user,
      existingUser,
      right.role,
    )

    await createUserOnStudy({
      account: { connect: { id: accountId } },
      study: { connect: { id: studyWithRights.id } },
      role: right.role,
    })
  })

export const changeStudyRole = async (studyId: string, email: string, studyRole: StudyRole) =>
  withServerResponse('changeStudyRole', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [studyWithRights, existingAccount, existingUser] = await Promise.all([
      getStudyById(studyId, session.user.organizationVersionId),
      getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId),
      getUserByEmail(email),
    ])

    if (!studyWithRights || !existingAccount) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canAddRightOnStudy(session.user, studyWithRights, existingUser, studyRole)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      existingAccount &&
      isAdminOnStudyOrga(
        accountWithUserToUserSession(existingAccount as AccountWithUser),
        studyWithRights.organizationVersion as OrganizationVersionWithOrganization,
      ) &&
      studyRole !== StudyRole.Validator
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      existingAccount &&
      !checkLevel(existingAccount.user.level, studyWithRights.level) &&
      studyRole !== StudyRole.Reader
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      existingAccount &&
      existingUser &&
      studyWithRights.isPublic &&
      (await isInOrgaOrParentFromId(existingAccount.organizationVersionId, studyWithRights.organizationVersionId))
    ) {
      const defaultRole = getUserRoleOnPublicStudy(
        { role: existingAccount.role, level: existingUser?.level, environment: existingAccount.environment },
        studyWithRights.level,
      )
      if (!getAllowedRolesFromDefaultRole(defaultRole).includes(studyRole)) {
        throw new Error(NOT_AUTHORIZED)
      }
    }

    await updateUserOnStudy(existingAccount.id, studyWithRights.id, studyRole)
  })

export const newStudyContributor = async ({ email, subPosts, ...command }: NewStudyContributorCommand) =>
  withServerResponse('newStudyContributor', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user || !session.user.organizationVersionId) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [studyWithRights, existingAccount, existingUser] = await Promise.all([
      getStudyById(command.studyId, session.user.organizationVersionId),
      getAccountByEmailAndOrganizationVersionId(email, session.user.organizationVersionId),
      getUserByEmail(email),
    ])

    if (!studyWithRights) {
      throw new Error(NOT_AUTHORIZED)
    }

    const organizationVersion = await getOrganizationVersionById(studyWithRights.organizationVersionId)
    if (!organizationVersion) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!canAddContributorOnStudy(session.user, studyWithRights)) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      existingAccount &&
      getAccountRoleOnStudy(accountWithUserToUserSession(existingAccount as AccountWithUser), studyWithRights)
    ) {
      throw new Error(ALREADY_IN_STUDY)
    }

    const accountId = await getOrCreateUserAndSendStudyInvite(
      email,
      studyWithRights,
      organizationVersion as OrganizationVersionWithOrganization,
      session.user,
      existingUser,
    )

    const selectedSubposts = Object.values(subPosts).reduce((res, subPosts) => res.concat(subPosts), [])
    await createContributorOnStudy(accountId, selectedSubposts, command)
  })

export const deleteStudyCommand = async ({ id, name }: DeleteCommand) =>
  withServerResponse('deleteStudyCommand', async () => {
    if (!(await canDeleteStudy(id))) {
      throw new Error(NOT_AUTHORIZED)
    }
    const studyName = await getStudyNameById(id)
    if (!studyName) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (studyName.toLowerCase() !== name.toLowerCase()) {
      throw new Error('wrongName')
    }
    await deleteStudy(id)
  })

export const addFlowToStudy = async (studyId: string, file: File) =>
  withServerResponse('addFlowToStudy', async () => {
    const session = await auth()
    const allowedType = await isAllowedFileType(file, allowedFlowFileTypes)
    if (!allowedType) {
      throw new Error('invalidFileType')
    }
    const allowedUserId = await canEditStudyFlows(studyId)
    if (!allowedUserId) {
      throw new Error(NOT_AUTHORIZED)
    }
    const butcketUploadResult = await uploadFileToBucket(file)
    if (butcketUploadResult.success) {
      await createDocument({
        name: file.name,
        type: file.type,
        uploader: { connect: { id: session?.user.accountId } },
        study: { connect: { id: studyId } },
        bucketKey: butcketUploadResult.data.key,
        bucketETag: butcketUploadResult.data.ETag || '',
      })
    }
  })

export const deleteFlowFromStudy = async (document: Document, studyId: string) =>
  withServerResponse('deleteFlowFromStudy', async () => {
    if (!(await canAccessFlowFromStudy(document.id, studyId)) || !(await canEditStudyFlows(studyId))) {
      throw new Error(NOT_AUTHORIZED)
    }
    const bucketDelete = await deleteFileFromBucket(document.bucketKey)
    if (bucketDelete.success) {
      await deleteDocument(document.id)
    }
  })

const hasAccessToStudy = (user: UserSession, study: AsyncReturnType<typeof getStudiesSitesFromIds>[0]['study']) => {
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

export const findStudiesWithSites = async (siteIds: string[]) =>
  withServerResponse('findStudiesWithSites', async () => {
    const [session, studySites] = await Promise.all([dbActualizedAuth(), getStudiesSitesFromIds(siteIds)])

    const user = session?.user
    const authorizedStudySites: AsyncReturnType<typeof getStudiesSitesFromIds> = []
    const unauthorizedStudySites: (Pick<AsyncReturnType<typeof getStudiesSitesFromIds>[0], 'site' | 'study'> & {
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
  })

export const deleteStudyMember = async (member: FullStudy['allowedUsers'][0], studyId: string) =>
  withServerResponse('deleteStudyMember', async () => {
    const [session, study] = await Promise.all([dbActualizedAuth(), getStudy(studyId)])
    if (
      !session?.user ||
      !study.success ||
      !study.data ||
      !hasEditionRights(getAccountRoleOnStudy(session.user, study.data))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    await deleteAccountOnStudy(studyId, member.accountId)
  })

export const deleteStudyContributor = async (contributor: StudyContributorDeleteParams, studyId: string) =>
  withServerResponse('deleteStudyContributor', async () => {
    const [session, study] = await Promise.all([dbActualizedAuth(), getStudy(studyId)])
    if (
      !session?.user ||
      !study.success ||
      !study.data ||
      !hasEditionRights(getAccountRoleOnStudy(session.user, study.data))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }
    await deleteContributor(studyId, contributor)
  })

export const getStudyEmissionFactorImportVersions = async (studyId: string) =>
  withServerResponse('getStudyEmissionFactorImportVersions', async () => {
    const study = await getStudy(studyId)
    if (!study.success) {
      return []
    }
    return getStudyEmissionFactorSources(studyId)
  })

export const getOrganizationStudiesFromOtherUsers = async (organizationVersionId: string, accountId: string) =>
  withServerResponse('getOrganizationStudiesFromOtherUsers', async () =>
    countOrganizationStudiesFromOtherUsers(organizationVersionId, accountId),
  )

const getMetaData = (emissionFactor: AsyncReturnType<typeof getEmissionFactorsByIdsAndSource>[0], locale: LocaleType) =>
  emissionFactor.metaData.find((metadata) => metadata.language === locale) ?? emissionFactor.metaData[0]

export const simulateStudyEmissionFactorSourceUpgrade = async (studyId: string, source: Import) =>
  withServerResponse('simulateStudyEmissionFactorSourceUpgrade', async () => {
    const [session, study, importVersions, locale] = await Promise.all([
      dbActualizedAuth(),
      getStudyById(studyId, null),
      getEmissionFactorVersionsBySource(source),
      getLocale(),
    ])
    if (!session || !session.user || !study || !importVersions.length) {
      throw new Error('data not found')
    }

    if (!(await canUpgradeSourceVersion(session.user, study))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const latestSourceVersion = importVersions[0]
    if (
      latestSourceVersion.id ===
      study.emissionFactorVersions.find((version) => version.source === source)?.importVersionId
    ) {
      throw new Error('latest')
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
      emissionSources: targetedEmissionSources,
      deleted: deletedEmissionFactors,
      updated: updatedEmissionFactors,
      latestSourceVersion,
    }
  })

export const upgradeStudyEmissionFactorSource = async (studyId: string, source: Import) =>
  withServerResponse('upgradeStudyEmissionFactorSource', async () => {
    const simulationResults = await simulateStudyEmissionFactorSourceUpgrade(studyId, source)
    if (!simulationResults.success) {
      throw new Error(simulationResults.errorMessage)
    }

    const importedIds = (simulationResults.data.emissionSources || [])
      .map((emissionSource) => emissionSource.emissionFactor?.importedId)
      .filter((importId) => importId !== null && importId !== undefined)

    const upgradedEmissionFactors = await getEmissionFactorsByImportedIdsAndVersion(
      importedIds,
      (simulationResults.data.latestSourceVersion as EmissionFactorImportVersion).id,
    )

    const updatePromises = (simulationResults.data.emissionSources || []).reduce((promises, emissionSource) => {
      const newEmissionFactor = (upgradedEmissionFactors || []).find(
        (emissionFactor) => emissionFactor.importedId === emissionSource.emissionFactor?.importedId,
      )
      return promises.concat(
        newEmissionFactor ? [updateEmissionSourceEmissionFactor(emissionSource.id, newEmissionFactor.id)] : [],
      )
    }, [] as Prisma.PrismaPromise<StudyEmissionSource>[])
    const deletePromises = (simulationResults.data.deleted || []).reduce((promises, emissionFactor) => {
      const emissionSources =
        simulationResults.data.emissionSources?.filter(
          (emissionSource) => emissionSource.emissionFactor?.id === emissionFactor.id,
        ) || []
      return promises.concat(
        emissionSources.map((emissionSource) => clearEmissionSourceEmissionFactor(emissionSource.id)),
      )
    }, [] as Prisma.PrismaPromise<StudyEmissionSource>[])
    await Promise.all(updatePromises.concat(deletePromises))

    await updateStudyEmissionFactorVersion(studyId, source, simulationResults.data.latestSourceVersion?.id)

    return undefined
  })

export const duplicateStudyCommand = async (
  sourceStudyId: string,
  studyCommand: CreateStudyCommand,
  inviteExistingTeam = false,
  inviteExistingContributors = false,
) =>
  withServerResponse('duplicateStudyCommand', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canDuplicateStudy(sourceStudyId))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const sourceStudy = await getStudyById(sourceStudyId, session.user.organizationVersionId)
    if (!sourceStudy) {
      throw new Error(NOT_AUTHORIZED)
    }

    const createResult = await createStudyCommand(studyCommand, sourceStudy.resultsUnit)
    if (!createResult.success) {
      throw new Error(createResult.errorMessage || 'Failed to create study')
    }

    const createdStudyId = createResult.data.id

    const createdStudyWithSites = await getStudyById(createdStudyId, session.user.organizationVersionId)
    if (!createdStudyWithSites) {
      throw new Error('Failed to retrieve created study')
    }

    const studySites = await getStudySites(createdStudyId)

    for (const sourceVersion of sourceStudy.emissionFactorVersions) {
      await updateStudyEmissionFactorVersion(createdStudyId, sourceVersion.source, sourceVersion.importVersionId)
    }

    const sourceEmissionSources = sourceStudy.emissionSources
    for (const sourceEmissionSource of sourceEmissionSources) {
      const sourceSiteId = sourceEmissionSource.studySite.site.id
      const targetStudySite = createdStudyWithSites.sites.find((studySite) => studySite.site.id === sourceSiteId)
      const targetStudySiteId = studySites.find((site) => targetStudySite && site.id === targetStudySite.id)?.id

      if (targetStudySiteId) {
        const emissionSourceData = {
          name: sourceEmissionSource.name,
          value: sourceEmissionSource.value,
          subPost: sourceEmissionSource.subPost,
          type: sourceEmissionSource.type,
          source: sourceEmissionSource.source,
          comment: sourceEmissionSource.comment,
          depreciationPeriod: sourceEmissionSource.depreciationPeriod,
          hectare: sourceEmissionSource.hectare,
          duration: sourceEmissionSource.duration,
          reliability: sourceEmissionSource.reliability,
          technicalRepresentativeness: sourceEmissionSource.technicalRepresentativeness,
          geographicRepresentativeness: sourceEmissionSource.geographicRepresentativeness,
          temporalRepresentativeness: sourceEmissionSource.temporalRepresentativeness,
          completeness: sourceEmissionSource.completeness,
          feReliability: sourceEmissionSource.feReliability,
          feTechnicalRepresentativeness: sourceEmissionSource.feTechnicalRepresentativeness,
          feGeographicRepresentativeness: sourceEmissionSource.feGeographicRepresentativeness,
          feTemporalRepresentativeness: sourceEmissionSource.feTemporalRepresentativeness,
          feCompleteness: sourceEmissionSource.feCompleteness,
          caracterisation: sourceEmissionSource.caracterisation,
          study: { connect: { id: createdStudyId } },
          emissionFactor: sourceEmissionSource.emissionFactor
            ? { connect: { id: sourceEmissionSource.emissionFactor.id } }
            : undefined,
          studySite: { connect: { id: targetStudySiteId } },
          validated: false,
        } as Prisma.StudyEmissionSourceCreateInput

        await createStudyEmissionSource(emissionSourceData)
      }
    }

    if (inviteExistingTeam) {
      const organizationVersion = await getOrganizationVersionById(createdStudyWithSites.organizationVersionId)
      if (organizationVersion) {
        for (const teamMember of sourceStudy.allowedUsers) {
          // Skip the current user since they're already added as the creator
          if (teamMember.account.user.email === session.user.email) {
            continue
          }

          const existingUser = await getUserByEmail(teamMember.account.user.email)
          const accountId = await getOrCreateUserAndSendStudyInvite(
            teamMember.account.user.email,
            createdStudyWithSites,
            organizationVersion as OrganizationVersionWithOrganization,
            session.user,
            existingUser,
            teamMember.role,
            true,
          )

          await createUserOnStudy({
            account: { connect: { id: accountId } },
            study: { connect: { id: createdStudyId } },
            role: teamMember.role,
          })
        }
      }
    }

    if (inviteExistingContributors) {
      const organizationVersion = await getOrganizationVersionById(createdStudyWithSites.organizationVersionId)
      if (organizationVersion) {
        const contributorsByEmail = sourceStudy.contributors.reduce(
          (acc, contributor) => {
            const email = contributor.account.user.email
            if (!acc[email]) {
              acc[email] = []
            }
            acc[email].push(contributor.subPost)
            return acc
          },
          {} as Record<string, SubPost[]>,
        )

        for (const [email, subPosts] of Object.entries(contributorsByEmail)) {
          // Skip the current user since they're already added as the creator
          if (email === session.user.email) {
            continue
          }

          const existingUser = await getUserByEmail(email)
          const accountId = await getOrCreateUserAndSendStudyInvite(
            email,
            createdStudyWithSites,
            organizationVersion as OrganizationVersionWithOrganization,
            session.user,
            existingUser,
            undefined,
            true,
          )

          await createContributorOnStudy(accountId, subPosts, {
            studyId: createdStudyId,
          })
        }
      }
    }

    addUserChecklistItem(UserChecklist.CreateFirstStudy)
    return { id: createdStudyId }
  })

export const duplicateStudyEmissionSource = async (
  studyId: string,
  emissionSource: FullStudy['emissionSources'][0],
  studySite: string,
) =>
  withServerResponse('duplicateStudyEmissionSource', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }
    const study = await getStudyById(studyId, session.user.organizationVersionId)

    if (
      !study ||
      !getAccountRoleOnStudy(session.user, study) ||
      !hasEditionRights(getAccountRoleOnStudy(session.user, study))
    ) {
      throw new Error(NOT_AUTHORIZED)
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
  })

export const getCncByNumeroAuto = async (numeroAuto: string) =>
  withServerResponse('getCncByNumeroAuto', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    return await findCncByNumeroAuto(numeroAuto)
  })
