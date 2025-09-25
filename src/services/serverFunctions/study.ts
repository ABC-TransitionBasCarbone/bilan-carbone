/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { StudyContributorDeleteParams } from '@/components/study/rights/StudyContributorsTable'
import {
  getQuestionsAffectedBySiteDataChange,
  SITE_DEPENDENT_FIELDS,
  SiteDependentField,
} from '@/constants/emissionFactorMap'
import { defaultEmissionSourceTags } from '@/constants/emissionSourceTags'
import {
  AccountWithUser,
  addAccount,
  getAccountByEmailAndEnvironment,
  getAccountByEmailAndOrganizationVersionId,
  getAccountsByUserIdsAndEnvironment,
  getAccountsUserLevel,
} from '@/db/account'
import { prismaClient } from '@/db/client'
import { findCncByCncCode, updateNumberOfProgrammedFilms } from '@/db/cnc'
import { createDocument, deleteDocument } from '@/db/document'
import {
  getEmissionFactorsByIdsAndSource,
  getEmissionFactorsByImportedIdsAndVersion,
  getEmissionFactorsImportActiveVersion,
  getEmissionFactorVersionsBySource,
  getStudyEmissionFactorSources,
} from '@/db/emissionFactors'
import { createEmissionSourceTagFamilyAndRelatedTags, getFamilyTagsForStudy } from '@/db/emissionSource'
import {
  getOrganizationVersionById,
  getOrganizationVersionsByOrganizationId,
  getOrganizationWithSitesById,
  isOrganizationVersionCR,
  OrganizationVersionWithOrganization,
} from '@/db/organization'
import { getAnswerByQuestionId, getQuestionByIdIntern, getQuestionsByIdIntern } from '@/db/question'
import {
  clearEmissionSourceEmissionFactor,
  countOrganizationStudiesFromOtherUsers,
  createContributorOnStudy,
  createStudy,
  createStudyEmissionSource,
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
  upsertStudyExport,
} from '@/db/study'
import { addUser, getUserApplicationSettings, getUserByEmail, getUserSourceById, UserWithAccounts } from '@/db/user'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { getNestedValue } from '@/utils/array'
import { mapCncToStudySite } from '@/utils/cnc'
import { calculateDistanceFromParis } from '@/utils/distance'
import { CA_UNIT_VALUES, defaultCAUnit, formatNumber } from '@/utils/number'
import { withServerResponse } from '@/utils/serverResponse'
import {
  getAccountRoleOnStudy,
  getAllowedRolesFromDefaultRole,
  getUserRoleOnPublicStudy,
  hasEditionRights,
} from '@/utils/study'
import { formatDateFr } from '@/utils/time'
import { isAdmin } from '@/utils/user'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import {
  Account,
  ControlMode,
  Document,
  DocumentCategory,
  EmissionFactor,
  EmissionFactorImportVersion,
  EmissionSourceCaracterisation,
  Environment,
  Export,
  Import,
  Level,
  OrganizationVersion,
  Prisma,
  Role,
  StudyEmissionSource,
  StudyResultUnit,
  StudyRole,
  SubPost,
  UserChecklist,
  UserStatus,
} from '@prisma/client'
import Docxtemplater from 'docxtemplater'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import PizZip from 'pizzip'
import { v4 as uuidv4 } from 'uuid'
import { auth, dbActualizedAuth } from '../auth'
import { getCaracterisationsBySubPost } from '../emissionSource'
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
  canDuplicateStudyInOtherEnvironment,
  canEditStudyFlows,
  canUpgradeSourceVersion,
  isAdminOnStudyOrga,
} from '../permissions/study'
import { deleteFileFromBucket, getFileFromBucket, uploadFileToBucket } from '../serverFunctions/scaleway'
import { checkLevel, getTransEnvironmentSubPost } from '../study'
import { saveAnswerForQuestion } from './question'
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
import { addUserChecklistItem, getUserActiveAccounts, sendInvitation } from './user'

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

    const environmentTags =
      defaultEmissionSourceTags[session.user.environment as keyof typeof defaultEmissionSourceTags]
    const emissionSourceTagFamilies: Prisma.EmissionSourceTagFamilyCreateNestedManyWithoutStudyInput = {
      create: [
        {
          name: 'défaut',
          emissionSourceTags: environmentTags
            ? {
                create: environmentTags.map((tag) => ({ name: tag.name, color: tag.color })),
              }
            : undefined,
        },
      ],
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

              const cncData = organizationSite.cnc
              const studySiteData: Prisma.StudySiteCreateManyStudyInput = {
                siteId: site.id,
                etp: site.etp || organizationSite.etp,
                ca: site.ca ? site.ca * caUnit : organizationSite.ca,
                volunteerNumber: site.volunteerNumber || organizationSite.volunteerNumber,
                beneficiaryNumber: site.beneficiaryNumber || organizationSite.beneficiaryNumber,
              }

              if (cncData) {
                Object.assign(studySiteData, mapCncToStudySite(cncData))
                studySiteData.cncVersionId = cncData.cncVersionId
              }

              return studySiteData
            })
            .filter((site) => site !== undefined),
        },
      },
      emissionSourceTagFamilies,
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

export const changeStudyCinema = async (studySiteId: string, cncId: string, data: ChangeStudyCinemaCommand) =>
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
    const { openingHours, openingHoursHoliday, numberOfProgrammedFilms, ...updateData } = data

    if (!canChangeOpeningHours(informations.user, informations.studyWithRights)) {
      throw new Error(NOT_AUTHORIZED)
    }

    // Detect changes in fields with dependencies and calculate distanceToParis
    const currentSite = studySites[0]
    const changedFields: SiteDependentField[] = []
    let calculatedDistanceToParis: number | undefined

    // Calculate distanceToParis if CNC data with coordinates is available
    const cncData = currentSite.site.cnc
    if (cncData?.latitude && cncData?.longitude) {
      calculatedDistanceToParis = calculateDistanceFromParis({
        latitude: cncData.latitude,
        longitude: cncData.longitude,
      })
    }

    for (const field of SITE_DEPENDENT_FIELDS) {
      if (field === 'numberOfProgrammedFilms') {
        const currentCncValue = currentSite.site.cnc?.numberOfProgrammedFilms ?? 0
        if (numberOfProgrammedFilms !== undefined && numberOfProgrammedFilms !== currentCncValue) {
          changedFields.push(field)
        }
      } else {
        if (updateData[field] !== undefined && updateData[field] !== currentSite[field]) {
          changedFields.push(field)
        }
      }
    }

    // Prefill fields from CNC data if they are not already set
    const enhancedUpdateData: Record<string, number | null | undefined> = { ...updateData }

    if (cncData) {
      // Calculate distance to Paris only if not already set (calculated once and remains fixed)
      if (calculatedDistanceToParis !== undefined && currentSite.distanceToParis == null) {
        enhancedUpdateData.distanceToParis = calculatedDistanceToParis
      }

      // Prefill other fields from CNC data only if they are null/undefined in current data
      Object.assign(enhancedUpdateData, mapCncToStudySite(cncData, currentSite))
    }

    const finalUpdateData = enhancedUpdateData

    await updateNumberOfProgrammedFilms({ cncId, numberOfProgrammedFilms })
    await updateStudyOpeningHours(studySiteId, openingHours, openingHoursHoliday)
    await updateStudySiteData(studySiteId, finalUpdateData)

    // Recalculate emissions for affected emissions if dependent fields changed
    if (changedFields.length > 0 && informations.user.organizationVersionId) {
      const affectedQuestionIds = getQuestionsAffectedBySiteDataChange(changedFields)
      await recalculateEmissionsForQuestions(study.id, informations.user.organizationVersionId, affectedQuestionIds)
    }
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

const recalculateEmissionsForQuestions = async (
  studyId: string,
  organizationVersionId: string,
  affectedQuestionIds: string[],
) => {
  if (affectedQuestionIds.length === 0) {
    return
  }

  const study = await getStudyById(studyId, organizationVersionId)
  if (!study) {
    throw new Error(NOT_AUTHORIZED)
  }

  for (const questionIdIntern of affectedQuestionIds) {
    const question = await getQuestionByIdIntern(questionIdIntern)
    if (!question) {
      continue
    }

    for (const studySite of study.sites) {
      const answer = await getAnswerByQuestionId(question.id, studySite.id)
      if (!answer || !answer.response) {
        continue
      }

      // Re-save the answer to trigger recalculation through the normal flow
      await saveAnswerForQuestion(question, answer.response, study.id, studySite.id)
    }
  }
}

export const changeStudySites = async (studyId: string, { organizationId, ...command }: ChangeStudySitesCommand) =>
  withServerResponse('changeStudySites', async () => {
    const [organization, session, study] = await Promise.all([
      getOrganizationWithSitesById(organizationId),
      dbActualizedAuth(),
      getStudyById(studyId, organizationId),
    ])

    if (!organization || !session || !study) {
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
    return upsertStudyExport(studyId, type, control)
  })

export const updateCaracterisationsForControlMode = async (studyId: string, newControlMode: ControlMode) =>
  withServerResponse('updateCaracterisationsForControlMode', async () => {
    const [session, study] = await Promise.all([dbActualizedAuth(), getStudy(studyId)])
    if (!session || !session.user || !study.success || !study.data) {
      throw new Error(NOT_AUTHORIZED)
    }
    if (!hasEditionRights(getAccountRoleOnStudy(session.user, study.data))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const emissionSources = study.data.emissionSources
    const exportsWithNewControlMode = study.data.exports.map((exp) => ({
      ...exp,
      control: newControlMode,
    }))

    await Promise.all(
      emissionSources
        .map((emissionSource) => {
          if (!emissionSource.caracterisation && !emissionSource.validated) {
            return null
          }

          const validCaracterisations = getCaracterisationsBySubPost(
            emissionSource.subPost,
            exportsWithNewControlMode || [],
            session.user.environment,
          )

          const isValidForNewControlMode = validCaracterisations.includes(
            emissionSource.caracterisation as EmissionSourceCaracterisation,
          )

          if (!isValidForNewControlMode) {
            if (validCaracterisations.length === 1) {
              const newCaracterisation = validCaracterisations[0]
              const shouldKeepValidation = emissionSource.caracterisation && emissionSource.validated

              return prismaClient.studyEmissionSource.update({
                where: { id: emissionSource.id },
                data: {
                  caracterisation: newCaracterisation,
                  validated: shouldKeepValidation,
                },
              })
            } else {
              return prismaClient.studyEmissionSource.update({
                where: { id: emissionSource.id },
                data: { caracterisation: null, validated: false },
              })
            }
          }
          return null
        })
        .filter(Boolean),
    )

    return
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

export const addDocumentToStudy = async (studyId: string, file: File, documentCategory?: DocumentCategory) =>
  withServerResponse('addDocumentToStudy', async () => {
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
        documentCategory,
      })
    }
  })

export const deleteDocumentFromStudy = async (document: Document, studyId: string) =>
  withServerResponse('deleteDocumentFromStudy', async () => {
    if (!(await canAccessFlowFromStudy(document.id, studyId)) || !(await canEditStudyFlows(studyId))) {
      throw new Error(NOT_AUTHORIZED)
    }
    const bucketDelete = await deleteFileFromBucket(document.bucketKey)
    if (bucketDelete.success) {
      await deleteDocument(document.id)
    }
  })

export const getQuestionsGroupedBySubPost = async (questionIds: string[], studySiteId?: string) =>
  withServerResponse('getQuestionsGroupedBySubPost', async () => {
    const questionsBySubPost: Record<
      string,
      Array<{ id: string; label: string; idIntern: string; answer?: string }>
    > = {}

    for (const questionId of questionIds) {
      const questions = await getQuestionsByIdIntern(questionId)
      if (questions) {
        for (const question of questions) {
          if (!questionsBySubPost[question.subPost]) {
            questionsBySubPost[question.subPost] = []
          }

          let answerText: string | undefined
          if (studySiteId) {
            const answer = await getAnswerByQuestionId(question.id, studySiteId)
            if (answer && answer.response) {
              answerText = typeof answer.response === 'string' ? answer.response : JSON.stringify(answer.response)
            }
          }

          questionsBySubPost[question.subPost].push({
            id: question.id,
            label: question.label,
            idIntern: question.idIntern,
            answer: answerText,
          })
        }
      }
    }

    return questionsBySubPost
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

    // Check if control modes have changed to determine if we should clear characterizations
    const sourceExportsByType = sourceStudy.exports.reduce(
      (acc, exp) => {
        acc[exp.type] = exp.control
        return acc
      },
      {} as Record<Export, ControlMode>,
    )

    const hasControlModeChanged = (exportType: Export) => {
      const sourceControl = sourceExportsByType[exportType]
      const newControl = studyCommand.exports[exportType]
      return sourceControl && newControl && sourceControl !== newControl
    }

    const shouldClearCaracterisations = Object.values(Export).some(hasControlModeChanged)

    const tagFamilies = await createEmissionSourceTagFamilyAndRelatedTags(
      createdStudyId,
      sourceStudy.emissionSourceTagFamilies.map((tagFamily) => ({
        familyName: tagFamily.name,
        tags: tagFamily.emissionSourceTags.map((tag) => ({
          name: tag.name,
          color: tag.color ?? '',
        })),
      })),
      session.user.environment,
    )

    const oldTagFamilies = await getFamilyTagsForStudy(sourceStudy.id)

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
          // Clear characterization if control mode changed, otherwise keep it
          caracterisation: shouldClearCaracterisations ? null : sourceEmissionSource.caracterisation,
          study: { connect: { id: createdStudyId } },
          emissionFactor: sourceEmissionSource.emissionFactor
            ? { connect: { id: sourceEmissionSource.emissionFactor.id } }
            : undefined,
          studySite: { connect: { id: targetStudySiteId } },
          validated: false,
          emissionSourceTags: {
            connect: sourceEmissionSource.emissionSourceTags
              .map((emissionSourceTag) => {
                const oldTagFamily = oldTagFamilies.find((tagFamily) => tagFamily.id === emissionSourceTag.familyId)
                const foundTagFamily = tagFamilies.find((tagFamily) => tagFamily.name === oldTagFamily?.name)
                const foundTag = foundTagFamily?.emissionSourceTags.find((tag) => tag.name === emissionSourceTag.name)

                if (!foundTag) {
                  return null
                }
                return { id: foundTag?.id }
              })
              .filter((tag) => tag !== null),
          },
        }

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

export const duplicateStudyInOtherEnvironment = async (studyId: string, targetEnvironment: Environment) =>
  withServerResponse('duplicateStudyInOtherEnvironment', async () => {
    const session = await dbActualizedAuth()

    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [study, duplicableEnvironments] = await Promise.all([
      getStudyById(studyId, session.user.id),
      canDuplicateStudyInOtherEnvironment(studyId),
    ])

    if (
      !study ||
      study.organizationVersion.environment === targetEnvironment ||
      !duplicableEnvironments.includes(targetEnvironment)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [organizationVersions, usersAccounts] = await Promise.all([
      getOrganizationVersionsByOrganizationId(study.organizationVersion.organization.id),
      getUserActiveAccounts(),
    ])
    if (
      !organizationVersions.length ||
      !organizationVersions.find((organizationVersion) => organizationVersion.environment === targetEnvironment) ||
      !usersAccounts.success ||
      !usersAccounts.data.find((account) => account.environment === targetEnvironment)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const targetOrganizationVersion = organizationVersions.find(
      (organizationVersion) => organizationVersion.environment === targetEnvironment,
    ) as OrganizationVersion
    const targetUserAccount = usersAccounts.data.find((account) => account.environment === targetEnvironment) as Account

    // allowed users
    const targetUsersAccounts = await getAccountsByUserIdsAndEnvironment(
      study.allowedUsers.map((user) => user.account.user.id),
      targetEnvironment,
    )
    const allowedUsers = [
      ...targetUsersAccounts
        .filter((account) => account.id !== targetUserAccount.id)
        .map((account) => {
          const sourceUser = study.allowedUsers.find((studyUser) => studyUser.account.user.id === account.user.id)
          if (!sourceUser) {
            return undefined
          }
          return {
            accountId: account.id,
            role: sourceUser.role,
          }
        })
        .filter((account) => !!account),
      { accountId: targetUserAccount.id, role: StudyRole.Validator },
    ]

    const targetContributorsAccounts = await getAccountsByUserIdsAndEnvironment(
      study.contributors.map((contributor) => contributor.account.user.id),
      targetEnvironment,
    )
    const allowedContributors = targetContributorsAccounts
      .map((account) => {
        const sourceContributor = study.contributors.find(
          (contributor) => contributor.account.user.id === account.user.id,
        )
        if (!sourceContributor) {
          return undefined
        }
        return {
          accountId: account.id,
          subPost: getTransEnvironmentSubPost(
            study.organizationVersion.environment,
            targetEnvironment,
            sourceContributor.subPost,
          ),
        }
      })
      .filter(
        (contributor): contributor is { accountId: string; subPost: SubPost } => !!contributor && !!contributor.subPost,
      )

    // sites
    const organization = await getOrganizationWithSitesById(study.organizationVersion.organization.id)
    if (!organization) {
      throw new Error(NOT_AUTHORIZED)
    }
    const sites = study.sites
      .map((studySite) => {
        const organizationSite = organization.sites.find(
          (organizationSite) => organizationSite.id === studySite.site.id,
        )
        if (!organizationSite) {
          return undefined
        }
        const studySiteData: Prisma.StudySiteCreateManyStudyInput = {
          siteId: studySite.site.id,
          etp: studySite.etp || organizationSite.etp,
          ca: studySite.ca ? studySite.ca : organizationSite.ca,
          volunteerNumber: studySite.volunteerNumber || organizationSite.volunteerNumber,
          beneficiaryNumber: studySite.beneficiaryNumber || organizationSite.beneficiaryNumber,
        }
        const cncData = organizationSite.cnc
        if (cncData) {
          Object.assign(studySiteData, mapCncToStudySite(cncData))
          studySiteData.cncVersionId = cncData.cncVersionId
        }

        return studySiteData
      })
      .filter((site) => !!site)

    // sources
    const sources = study.emissionSources.map((emissionSource) => ({
      ...emissionSource,
      subPost: getTransEnvironmentSubPost(
        study.organizationVersion.environment,
        targetEnvironment,
        emissionSource.subPost,
      ),
      studySite: {},
    }))

    const { id, createdById, organizationVersionId, ...restStudy } = study

    const studyCommand: Prisma.StudyCreateInput = {
      ...restStudy,
      createdBy: { connect: { id: targetUserAccount.id } },
      organizationVersion: { connect: { id: targetOrganizationVersion.id } },
      allowedUsers: {
        createMany: { data: allowedUsers },
      },
      contributors: {
        createMany: { data: allowedContributors },
      },
      exports: {
        createMany: { data: Object.values(restStudy.exports) },
      },
      sites: {
        createMany: { data: sites },
      },
      emissionSources: {
        createMany: { data: [] },
      },
      emissionFactorVersions: {
        createMany: {
          data: restStudy.emissionFactorVersions.map(({ id, ...emissionFactorVersion }) => emissionFactorVersion),
        },
      },
      emissionSourceTagFamilies: {
        create: restStudy.emissionSourceTagFamilies.map((tagFamily) => ({
          name: tagFamily.name,
          emissionSourceTags: {
            createMany: {
              data: tagFamily.emissionSourceTags.map(({ id, familyId, ...emissionSourceTag }) => emissionSourceTag),
            },
          },
        })),
      },
    }
    const createdStudy = await createStudy(studyCommand, targetEnvironment, true)
    return
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
      emissionSourceTags: { connect: emissionSource.emissionSourceTags.map((tag) => ({ id: tag.id })) },
    } as Prisma.StudyEmissionSourceCreateInput

    await createStudyEmissionSource(data)
  })

export const getCncByCncCode = async (cncCode: string) =>
  withServerResponse('getCncByCncCode', async () => {
    const session = await dbActualizedAuth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    return await findCncByCncCode(cncCode)
  })

export const mapStudyForReport = async (
  study: FullStudy,
  results: {
    monetaryRatio: number
    nonSpecificMonetaryRatio: number
  },
) => {
  const isParentCR = !!(
    study.organizationVersion.parentId && (await isOrganizationVersionCR(study.organizationVersion.parentId))
  )

  const allowedUsers = study.allowedUsers.map((user) => {
    const { firstName, lastName } = user.account.user
    return {
      accountId: user.accountId,
      name: `${firstName} ${lastName}`,
      role: user.role,
      createdAt: user.createdAt,
      isInternal: isParentCR
        ? user.account.organizationVersionId !== study.organizationVersion.parentId // All members that are not in the parent CR
        : user.account.organizationVersionId === study.organizationVersionId, // All members that are in the same organization as the study
      isExternal: isParentCR
        ? user.account.organizationVersionId === study.organizationVersion.parentId // All members that are in the parent CR
        : user.account.organizationVersionId !== study.organizationVersionId, // All members that are not in the same organization as the study
    }
  })

  const contributors: { accountId: string; name: string; isInternal: boolean; isExternal: boolean }[] = []
  study.contributors.forEach((contributor) => {
    if (!contributors.some((c) => c.accountId === contributor.accountId)) {
      const { firstName, lastName } = contributor.account.user
      contributors.push({
        accountId: contributor.accountId,
        name: `${firstName} ${lastName}`,
        isInternal: isParentCR
          ? contributor.account.organizationVersionId !== study.organizationVersion.parentId // All contributors that are not in the parent CR
          : false, // No contributors can be internal in a regular organization scenario
        isExternal: false, // No contributors can be external
      })
    }
  })

  const admin =
    allowedUsers
      .filter((user) => user.role === StudyRole.Validator)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0] || null
  const remainingMembers = allowedUsers.filter((user) => user.accountId !== admin?.accountId)
  const internalTeam = [
    ...remainingMembers.filter((user) => user.isInternal),
    ...contributors.filter((contributor) => contributor.isInternal),
  ]
  const externalTeam = [
    ...remainingMembers.filter((user) => user.isExternal),
    ...contributors.filter((contributor) => contributor.isExternal),
  ]

  const sites = study.sites.map((studySite) => ({
    id: studySite.id,
    name: studySite.site.name,
    city: studySite.site.city,
    postalCode: studySite.site.postalCode,
  }))

  const monetaryRatioPercentage = formatNumber(results.monetaryRatio, 2)
  const nonSpecificMonetaryRatioPercentage = formatNumber(results.nonSpecificMonetaryRatio, 2)
  const specificMonetaryRatioPercentage = formatNumber(results.monetaryRatio - results.nonSpecificMonetaryRatio, 2)

  const tLevel = await getTranslations('level')

  return {
    ...study,
    level: tLevel(study.level),
    // We need all cases here because docxtemplater doesn't support logical operators in conditions
    isInitialOrStandard: study.level === Level.Initial || study.level === Level.Standard,
    isStandardOrAdvanced: study.level === Level.Standard || study.level === Level.Advanced,
    isInitial: study.level === Level.Initial,
    isStandard: study.level === Level.Standard,
    isAdvanced: study.level === Level.Advanced,
    year: study.startDate.getFullYear(),
    startDate: formatDateFr(study.startDate),
    endDate: formatDateFr(study.endDate),
    admin,
    internalTeam,
    externalTeam,
    monetaryRatioPercentage: monetaryRatioPercentage,
    specificMonetaryRatioPercentage: specificMonetaryRatioPercentage,
    nonSpecificMonetaryRatioPercentage: nonSpecificMonetaryRatioPercentage,
    sites,
  }
}

export const prepareReport = async (
  study: FullStudy,
  results: {
    monetaryRatio: number
    nonSpecificMonetaryRatio: number
  },
) =>
  withServerResponse('prepareReport', async () => {
    const templateKey = process.env.SCW_REPORT_TEMPLATE_KEY
    if (!templateKey) {
      throw new Error('Report template key not configured')
    }

    const contentResult = await getFileFromBucket(templateKey)
    if (!contentResult.success) {
      throw new Error('Failed to fetch report template from Scaleway')
    }

    const content = contentResult.data
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      parser: (key: string) => ({
        get(scope) {
          if (key.includes('.')) {
            return getNestedValue(scope, key)
          }
          return scope[key]
        },
      }),
    })

    doc.render({
      study: await mapStudyForReport(study, results),
      organization: study.organizationVersion.organization,
    })
    const buffer = doc.toBuffer()
    const arrayBuffer = new ArrayBuffer(buffer.length)
    const view = new Uint8Array(arrayBuffer)
    for (let i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i]
    }
    return arrayBuffer
  })
