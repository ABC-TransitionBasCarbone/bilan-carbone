'use server'

import { DefaultStudyTagMap, DefaultStudyTagNames } from '@/constants/studyTags'
import { AccountWithUser, getAccountById } from '@/db/account'
import { getEmissionFactorById } from '@/db/emissionFactors'
import {
  createEmissionSourceOnStudy,
  createStudyTag,
  deleteEmissionSourceOnStudy,
  deleteStudyTag,
  getEmissionSourceById,
  getTagFamilyById,
  removeTagFamilyById,
  updateEmissionSourceOnStudy,
  updateStudyTag,
  upsertTagFamilyById,
} from '@/db/emissionSource'
import { getStudyById } from '@/db/study'
import { withServerResponse } from '@/utils/serverResponse'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { Import, Prisma, StudyTag, SubPost, UserChecklist } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canCreateEmissionSource,
  canDeleteEmissionSource,
  canUpdateEmissionSource,
} from '../permissions/emissionSource'
import { hasAccessToCreateStudyTag } from '../permissions/environment'
import { isVersionInOrgaOrParent } from '../permissions/organization'
import { CreateEmissionSourceCommand, NewStudyTagCommand, UpdateEmissionSourceCommand } from './emissionSource.command'
import { addUserChecklistItem } from './user'

export const createEmissionSource = async ({
  studyId,
  studySiteId,
  emissionFactorId,
  ...command
}: CreateEmissionSourceCommand & { validated?: boolean }) =>
  withServerResponse('createEmissionSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await canCreateEmissionSource(account as AccountWithUser, { studyId, studySiteId, ...command }))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [study, emissionFactor] = await Promise.all([
      getStudyById(studyId, account.organizationVersionId),
      emissionFactorId ? getEmissionFactorById(emissionFactorId) : undefined,
    ])

    if (
      emissionFactor?.version?.id &&
      !study?.emissionFactorVersions
        .map((emissionFactorVersion) => emissionFactorVersion.importVersionId)
        .includes(emissionFactor.version.id)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    let defaultTags: string[] = []
    const tags = await getDefaultTagIdsBySubPost(command.subPost, studyId)
    if (tags && tags.success) {
      defaultTags = tags.data as string[]
    }

    return await createEmissionSourceOnStudy({
      ...command,
      emissionSourceTags: { create: defaultTags.map((id) => ({ tagId: id })) },
      ...(emissionFactorId ? { emissionFactor: { connect: { id: emissionFactorId } } } : {}),
      studySite: { connect: { id: studySiteId } },
      study: { connect: { id: studyId } },
    })
  })

export const updateEmissionSource = async ({
  emissionSourceId,
  emissionFactorId,
  ...command
}: UpdateEmissionSourceCommand) =>
  withServerResponse('updateEmissionSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [account, emissionSource, emissionFactor] = await Promise.all([
      getAccountById(session.user.accountId),
      getEmissionSourceById(emissionSourceId),
      emissionFactorId ? getEmissionFactorById(emissionFactorId) : undefined,
    ])
    if (!account || !emissionSource) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(emissionSource.studyId, account.organizationVersionId)
    if (!study || !(await canUpdateEmissionSource(account as AccountWithUser, emissionSource, command, study))) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      emissionFactor?.version?.id &&
      !study.emissionFactorVersions
        .map((emissionFactorVersion) => emissionFactorVersion.importVersionId)
        .includes(emissionFactor.version.id)
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (
      emissionFactor?.importedFrom === Import.Manual &&
      emissionFactor.organizationId &&
      !(await isVersionInOrgaOrParent(emissionFactor.organizationId, study.organizationVersion))
    ) {
      throw new Error(NOT_AUTHORIZED)
    }

    const isContributor = study.contributors.some(
      (contributor) =>
        contributor.account.user.email === account.user.email && contributor.subPost === emissionSource.subPost,
    )

    let emissionSourceTags = undefined
    if (command.emissionSourceTags && Array.isArray(command.emissionSourceTags)) {
      const existingTagIds = emissionSource.emissionSourceTags.map((t) => t.tagId)
      const newTagIds = command.emissionSourceTags || []

      const toDelete = existingTagIds.filter((id) => !newTagIds.includes(id))
      const toCreate = newTagIds.filter((id) => !existingTagIds.includes(id))

      emissionSourceTags = {
        deleteMany: { tagId: { in: toDelete } },
        create: toCreate.map((tagId) => ({ tagId })),
      }
    }

    const data: Prisma.StudyEmissionSourceUpdateInput = {
      ...{
        ...command,
        emissionSourceTags,
      },
      ...(emissionFactorId !== undefined
        ? {
            ...(emissionFactorId
              ? { emissionFactor: { connect: { id: emissionFactorId } } }
              : { emissionFactor: { disconnect: true } }),
            feReliability: null,
            feTechnicalRepresentativeness: null,
            feGeographicRepresentativeness: null,
            feTemporalRepresentativeness: null,
            feCompleteness: null,
          }
        : {}),
    }

    await updateEmissionSourceOnStudy(
      emissionSourceId,
      isContributor ? { ...data, contributor: { connect: { id: account.id } } } : data,
    )
    addUserChecklistItem(UserChecklist.CreateFirstEmissionSource)
  })

export const deleteEmissionSource = async (emissionSourceId: string) =>
  withServerResponse('deleteEmissionSource', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const [account, emissionSource] = await Promise.all([
      getAccountById(session.user.accountId),
      getEmissionSourceById(emissionSourceId),
    ])
    if (!account || !emissionSource) {
      throw new Error(NOT_AUTHORIZED)
    }
    const study = await getStudyById(emissionSource.studyId, account.organizationVersionId)

    if (!study || !(await canDeleteEmissionSource(account as AccountWithUser, study))) {
      throw new Error(NOT_AUTHORIZED)
    }

    await deleteEmissionSourceOnStudy(emissionSourceId)
  })

export const getEmissionSourcesByStudyId = async (studyId: string) =>
  withServerResponse('getEmissionSourcesByStudyId', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      return []
    }

    const study = await getStudyById(studyId, account.organizationVersionId)
    if (!study) {
      return []
    }

    return study.emissionSources
  })

export const createTag = async ({ familyId, name, color }: NewStudyTagCommand) =>
  withServerResponse('createTag', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!hasAccessToCreateStudyTag(account.environment)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const tagFamily = await getTagFamilyById(familyId)

    if (!tagFamily) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(tagFamily.studyId, account.organizationVersionId)

    if (!study) {
      throw new Error(NOT_AUTHORIZED)
    }

    const role = getAccountRoleOnStudy(session.user, study)
    if (!role || !hasEditionRights(role)) {
      throw new Error(NOT_AUTHORIZED)
    }

    return await createStudyTag({
      family: { connect: { id: familyId } },
      name,
      color,
    })
  })

export const updateTag = async (tagId: string, name: string, color: string, familyId: string) =>
  withServerResponse('updateTag', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!hasAccessToCreateStudyTag(account.environment)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const updateData: { name: string; color: string; family?: { connect: { id: string } } } = { name, color }
    if (familyId) {
      updateData.family = { connect: { id: familyId } }
    }

    return updateStudyTag(tagId, updateData)
  })

export const deleteTag = async (tagId: string) =>
  withServerResponse('deleteTag', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!hasAccessToCreateStudyTag(account.environment)) {
      throw new Error(NOT_AUTHORIZED)
    }

    await deleteStudyTag(tagId)
  })

export const getTagFamiliesByStudyId = async (studyId: string) =>
  withServerResponse('getTagFamiliesByStudyId', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      return []
    }

    const study = await getStudyById(studyId, account.organizationVersionId)
    if (!study) {
      return []
    }

    return study.tagFamilies
  })

const getDefaultTagIdsBySubPost = async (subPost: SubPost, studyId: string) =>
  withServerResponse('getDefaultTagIdsBySubPost', async () => {
    const session = await auth()
    if (!session || !session.user) {
      return []
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      return []
    }

    const study = await getStudyById(studyId, account.organizationVersionId)
    if (!study) {
      return []
    }

    if (!(account.environment in DefaultStudyTagMap)) {
      return []
    }
    const tagObj = DefaultStudyTagMap[account.environment]
    if (!tagObj) {
      return []
    }
    const studyTags =
      study.tagFamilies.reduce((tags, family) => tags.concat(family.tags), [] as StudyTag[]) || ([] as StudyTag[])

    const defaultTags = []
    for (const tag of Object.keys(tagObj)) {
      if (tagObj[tag as DefaultStudyTagNames]?.includes(subPost)) {
        const tagData = studyTags?.find((studyTag) => studyTag.name === tag)
        if (tagData) {
          defaultTags.push(tagData.id)
        }
      }
    }
    return defaultTags
  })

export const createOrUpdateStudyTagFamily = async (studyId: string, name: string, familyId?: string) =>
  withServerResponse('createOrUpdateStudyTagFamily', async () => {
    const account = await auth()
    if (!account || !account.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!hasAccessToCreateStudyTag(account.user.environment)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, account.user.organizationVersionId)
    if (!study) {
      throw new Error(NOT_AUTHORIZED)
    }

    const role = getAccountRoleOnStudy(account.user, study)
    if (!role || !hasEditionRights(role)) {
      throw new Error(NOT_AUTHORIZED)
    }
    return upsertTagFamilyById(studyId, name, familyId)
  })

export const deleteStudyTagFamily = async (studyId: string, familyId: string) =>
  withServerResponse('deleteStudyTagFamily', async () => {
    const account = await auth()
    if (!account || !account.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!hasAccessToCreateStudyTag(account.user.environment)) {
      throw new Error(NOT_AUTHORIZED)
    }

    const study = await getStudyById(studyId, account.user.organizationVersionId)
    if (!study) {
      throw new Error(NOT_AUTHORIZED)
    }

    const role = getAccountRoleOnStudy(account.user, study)
    if (!role || !hasEditionRights(role)) {
      throw new Error(NOT_AUTHORIZED)
    }

    return removeTagFamilyById(familyId)
  })
