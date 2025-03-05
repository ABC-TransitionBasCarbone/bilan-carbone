'use server'

import { StudyContributorRow } from '@/components/study/rights/StudyContributorsTable'
import { prismaClient } from '@/db/client'
import { createDocument, deleteDocument } from '@/db/document'
import { getStudyEmissionFactorSources } from '@/db/emissionFactors'
import { getOrganizationById, getOrganizationWithSitesById } from '@/db/organization'
import {
  createContributorOnStudy,
  createStudy,
  createUserOnStudy,
  deleteStudy,
  FullStudy,
  getStudiesFromSites,
  getStudyById,
  getStudyNameById,
  getStudySites,
  updateStudy,
  updateStudySites,
  updateUserOnStudy,
} from '@/db/study'
import { addUser, getUserApplicationSettings, getUserByEmail } from '@/db/user'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { getUserRoleOnStudy, hasEditionRights } from '@/utils/study'
import {
  ControlMode,
  User as DBUser,
  Document,
  Export,
  Import,
  Organization,
  Prisma,
  Role,
  StudyRole,
  SubPost,
  UserStatus,
} from '@prisma/client'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
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
  canChangePublicStatus,
  canChangeSites,
  canCreateStudy,
  canDeleteStudy,
  canEditStudyFlows,
  isAdminOnStudyOrga,
} from '../permissions/study'
import { isAdmin } from '../permissions/user'
import { Post, subPostsByPost } from '../posts'
import { deleteFileFromBucket, uploadFileToBucket } from '../serverFunctions/scaleway'
import { checkLevel } from '../study'
import {
  ChangeStudyDatesCommand,
  ChangeStudyLevelCommand,
  ChangeStudyNameCommand,
  ChangeStudyPublicStatusCommand,
  ChangeStudySitesCommand,
  CreateStudyCommand,
  DeleteStudyCommand,
  NewStudyContributorCommand,
  NewStudyRightCommand,
} from './study.command'
import { sendInvitation } from './user'

export const getStudy = async (studyId: string) => {
  const session = await auth()
  if (!studyId || !session || !session.user) {
    return null
  }
  const study = await getStudyById(studyId, session.user.organizationId)
  if (!study || !hasAccessToStudy(session.user, study)) {
    return null
  }

  return study
}

export const createStudyCommand = async ({
  organizationId,
  validator,
  sites,
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
      userId: session.user.id,
    })
  } else {
    const userValidator = await getUserByEmail(validator)
    if (!userValidator) {
      return { success: false, message: NOT_AUTHORIZED }
    }

    rights.push({
      role: isAdmin(session.user.role) ? StudyRole.Validator : StudyRole.Editor,
      userId: session.user.id,
    })
    rights.push({
      role: StudyRole.Validator,
      userId: userValidator.id,
    })
  }

  const activeVersion = await prismaClient.emissionFactorImportVersion.findFirst({
    where: { source: Import.BaseEmpreinte },
    orderBy: { createdAt: 'desc' },
  })
  if (!activeVersion) {
    return { success: false, message: `noActiveVersion_${Import.BaseEmpreinte}` }
  }

  const studySites = sites.filter((site) => site.selected)
  const organization = await getOrganizationWithSitesById(organizationId)
  if (!organization) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  if (studySites.some((site) => organization.sites.every((organizationSite) => organizationSite.id !== site.id))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  const userCAUnit = (await getUserApplicationSettings(session.user.id))?.caUnit
  const caUnit = userCAUnit ? CA_UNIT_VALUES[userCAUnit] : defaultCAUnit

  const study = {
    ...command,
    createdBy: { connect: { id: session.user.id } },
    organization: { connect: { id: organizationId } },
    isPublic: command.isPublic === 'true',
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
            const organizationSite = organization.sites.find((organizationSite) => organizationSite.id === site.id)
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

  if (!(await canCreateStudy(session.user.email, study, organizationId))) {
    return { success: false, message: NOT_AUTHORIZED }
  }

  try {
    const createdStudy = await createStudy(study)
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

  const studyWithRights = await getStudyById(studyId, session.user.organizationId)

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

  if (!canChangeLevel(informations.user, informations.studyWithRights, command.level)) {
    return NOT_AUTHORIZED
  }
  await updateStudy(studyId, command)
}

export const changeStudyDates = async ({ studyId, ...command }: ChangeStudyDatesCommand) => {
  const informations = await getStudyRightsInformations(studyId)
  if (informations === null) {
    return NOT_AUTHORIZED
  }

  if (!canChangeDates(informations.user, informations.studyWithRights)) {
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

export const hasActivityData = async (
  studyId: string,
  deletedSites: ChangeStudySitesCommand['sites'],
  organizationId: string,
) => {
  const study = await getStudyById(studyId, organizationId)
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

  const userCAUnit = (await getUserApplicationSettings(session.user.id))?.caUnit
  const caUnit = userCAUnit ? CA_UNIT_VALUES[userCAUnit] : defaultCAUnit

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
  if (!hasEditionRights(getUserRoleOnStudy(session.user, study))) {
    return NOT_AUTHORIZED
  }
  if (control === false) {
    return prismaClient.studyExport.delete({ where: { studyId_type: { studyId, type } } })
  }
  return prismaClient.studyExport.create({ data: { studyId, type, control } })
}

const getOrCreateUserAndSendStudyInvite = async (
  email: string,
  study: FullStudy,
  organization: Organization,
  creator: User,
  existingUser: DBUser | null,
  role?: StudyRole,
) => {
  let userId = ''
  const t = await getTranslations('study.role')

  if (!existingUser) {
    const newUser = await addUser({
      email: email,
      status: UserStatus.VALIDATED,
      role: Role.COLLABORATOR,
      firstName: '',
      lastName: '',
    })

    await sendInvitation(email, study, organization, creator, role ? t(role).toLowerCase() : '')

    userId = newUser.id
  } else {
    if (existingUser.organizationId !== organization.id) {
      await sendInvitation(email, study, organization, creator, role ? t(role).toLowerCase() : '', existingUser)
    }
    userId = existingUser.id
  }

  return userId
}

export const newStudyRight = async (right: NewStudyRightCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, existingUser] = await Promise.all([
    getStudyById(right.studyId, session.user.organizationId),
    getUserByEmail(right.email),
  ])

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  const organization = await getOrganizationById(studyWithRights.organizationId)
  if (!organization) {
    return NOT_AUTHORIZED
  }

  if (!existingUser || !checkLevel(existingUser.level, studyWithRights.level)) {
    right.role = StudyRole.Reader
  }

  if (!canAddRightOnStudy(session.user, studyWithRights, existingUser, right.role)) {
    return NOT_AUTHORIZED
  }

  if (existingUser && isAdminOnStudyOrga(existingUser, studyWithRights.organization)) {
    right.role = StudyRole.Validator
  }

  if (
    studyWithRights.allowedUsers.some((allowedUser) => allowedUser.user.id === existingUser?.id) ||
    studyWithRights.contributors.some((contributor) => contributor.user.id === existingUser?.id)
  ) {
    return ALREADY_IN_STUDY
  }

  const userId = await getOrCreateUserAndSendStudyInvite(
    right.email,
    studyWithRights,
    organization,
    session.user,
    existingUser,
    right.role,
  )

  await createUserOnStudy({
    user: { connect: { id: userId } },
    study: { connect: { id: studyWithRights.id } },
    role: right.role,
  })
}

export const changeStudyRole = async (studyId: string, email: string, studyRole: StudyRole) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, existingUser] = await Promise.all([
    getStudyById(studyId, session.user.organizationId),
    getUserByEmail(email),
  ])

  if (!studyWithRights || !existingUser) {
    return NOT_AUTHORIZED
  }

  if (!canAddRightOnStudy(session.user, studyWithRights, existingUser, studyRole)) {
    return NOT_AUTHORIZED
  }

  if (
    existingUser &&
    isAdminOnStudyOrga(existingUser, studyWithRights.organization) &&
    studyRole !== StudyRole.Validator
  ) {
    return NOT_AUTHORIZED
  }

  await updateUserOnStudy(existingUser.id, studyWithRights.id, studyRole)
}

export const newStudyContributor = async ({ email, post, subPost, ...command }: NewStudyContributorCommand) => {
  const session = await auth()
  if (!session || !session.user) {
    return NOT_AUTHORIZED
  }

  const [studyWithRights, existingUser] = await Promise.all([
    getStudyById(command.studyId, session.user.organizationId),
    getUserByEmail(email),
  ])

  if (!studyWithRights) {
    return NOT_AUTHORIZED
  }

  const organization = await getOrganizationById(studyWithRights.organizationId)
  if (!organization) {
    return NOT_AUTHORIZED
  }

  if (!canAddContributorOnStudy(session.user, studyWithRights)) {
    return NOT_AUTHORIZED
  }

  if (studyWithRights.allowedUsers.some((allowedUser) => allowedUser.user.id === existingUser?.id)) {
    return ALREADY_IN_STUDY
  }

  const userId = await getOrCreateUserAndSendStudyInvite(
    email,
    studyWithRights,
    organization,
    session.user,
    existingUser,
  )

  if (post === 'all') {
    await createContributorOnStudy(userId, Object.values(SubPost), command)
  } else if (!subPost || subPost === 'all') {
    await createContributorOnStudy(userId, subPostsByPost[post], command)
  } else {
    await createContributorOnStudy(userId, [subPost], command)
  }
}

export const deleteStudyCommand = async ({ id, name }: DeleteStudyCommand) => {
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
    uploader: { connect: { id: session?.user.id } },
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

const hasAccessToStudy = (user: User, study: AsyncReturnType<typeof getStudiesFromSites>[0]['study']) => {
  // The function does not return the user's role, which is sensitive information.
  // We don't need to know the role, only whether or not the user has one
  // We therefore arbitrarily use the "Reader" role
  const allowedUsers = study.allowedUsers.map(({ userId }) => ({ user: { id: userId }, role: StudyRole.Reader }))
  const studyObject = { ...study, allowedUsers: allowedUsers }
  return (
    getUserRoleOnStudy(user, studyObject) || study.contributors.some((contributor) => contributor.userId === user.id)
  )
}

export const findStudiesWithSites = async (siteIds: string[]) => {
  const [session, studySites] = await Promise.all([auth(), getStudiesFromSites(siteIds)])

  const user = session?.user
  const authorizedStudySites: AsyncReturnType<typeof getStudiesFromSites> = []
  const unauthorizedStudySites: (Pick<AsyncReturnType<typeof getStudiesFromSites>[0], 'site'> & { count: number })[] =
    []

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
        unauthorizedStudySites.push({ site: studySite.site, count: 1 })
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
  if (!session?.user || !study || !hasEditionRights(getUserRoleOnStudy(session.user, study))) {
    return NOT_AUTHORIZED
  }

  const where = {
    studyId_userId: { studyId, userId: member.userId },
  }
  await prismaClient.userOnStudy.delete({ where })
}

export const deleteStudyContributor = async (contributor: StudyContributorRow, studyId: string) => {
  const [session, study] = await Promise.all([auth(), getStudy(studyId)])
  if (!session?.user || !study || !hasEditionRights(getUserRoleOnStudy(session.user, study))) {
    return NOT_AUTHORIZED
  }
  const where: Prisma.ContributorsWhereInput = {
    studyId,
    userId: contributor.userId,
  }
  if (contributor.subPosts[0] !== 'allSubPost') {
    where.subPost = contributor.subPosts[0] as SubPost
  } else if (contributor.post !== 'allPost') {
    const subPosts = subPostsByPost[contributor.post as Post]
    where.subPost = { in: subPosts }
  }
  await prismaClient.contributors.deleteMany({ where })
}

export const getStudyEmissionFactorImportVersions = async (studyId: string) => {
  const study = await getStudy(studyId)
  if (!study) {
    return []
  }
  return getStudyEmissionFactorSources(studyId)
}
