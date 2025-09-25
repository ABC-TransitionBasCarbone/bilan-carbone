'use server'

import { DefaultEmissionSourceTag, emissionSourceTagMap } from '@/constants/emissionSourceTags'
import { AccountWithUser, getAccountById } from '@/db/account'
import { getEmissionFactorById } from '@/db/emissionFactors'
import {
  createEmissionSourceOnStudy,
  createEmissionSourceTagOnStudy,
  deleteEmissionSourceOnStudy,
  deleteEmissionSourceTagOnStudy,
  getEmissionSourceById,
  getEmissionSourceTagFamilyById,
  removeSourceTagFamilyById,
  updateEmissionSourceOnStudy,
  updateEmissionSourceTagOnStudy,
  upsertEmissionSourceTagFamilyById,
} from '@/db/emissionSource'
import { getStudyById } from '@/db/study'
import { withServerResponse } from '@/utils/serverResponse'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'
import { EmissionSourceTag, Import, SubPost, UserChecklist } from '@prisma/client'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import {
  canCreateEmissionSource,
  canDeleteEmissionSource,
  canUpdateEmissionSource,
} from '../permissions/emissionSource'
import { hasAccessToCreateEmissionSourceTag } from '../permissions/environment'
import { isVersionInOrgaOrParent } from '../permissions/organization'
import {
  CreateEmissionSourceCommand,
  NewEmissionSourceTagCommand,
  UpdateEmissionSourceCommand,
} from './emissionSource.command'
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
    const tags = await getDefaultEmissionSourceTags(command.subPost, studyId)
    if (tags && tags.success) {
      defaultTags = tags.data as string[]
    }

    return await createEmissionSourceOnStudy({
      ...command,
      emissionSourceTags: { connect: defaultTags.map((id) => ({ id })) },
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

    const data = {
      ...{
        ...command,
        emissionSourceTags:
          command.emissionSourceTags && Array.isArray(command.emissionSourceTags)
            ? { set: command.emissionSourceTags.map((id) => ({ id })) }
            : command.emissionSourceTags,
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

export const createEmissionSourceTag = async ({ familyId, name, color }: NewEmissionSourceTagCommand) =>
  withServerResponse('createEmissionSourceTag', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await hasAccessToCreateEmissionSourceTag(account.environment))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const tagFamily = await getEmissionSourceTagFamilyById(familyId)

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

    return await createEmissionSourceTagOnStudy({
      family: { connect: { id: familyId } },
      name,
      color,
    })
  })

export const updateEmissionSourceTag = async (tagId: string, name: string, color: string) =>
  withServerResponse('updateEmissionSourceTag', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await hasAccessToCreateEmissionSourceTag(account.environment))) {
      throw new Error(NOT_AUTHORIZED)
    }

    return updateEmissionSourceTagOnStudy(tagId, { name, color })
  })

export const deleteEmissionSourceTag = async (tagId: string) =>
  withServerResponse('deleteEmissionSourceTag', async () => {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const account = await getAccountById(session.user.accountId)
    if (!account) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await hasAccessToCreateEmissionSourceTag(account.environment))) {
      throw new Error(NOT_AUTHORIZED)
    }

    await deleteEmissionSourceTagOnStudy(tagId)
  })

export const getEmissionSourceTagsByStudyId = async (studyId: string) =>
  withServerResponse('getEmissionSourceTagsByStudyId', async () => {
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

    return study.emissionSourceTagFamilies
  })

const getDefaultEmissionSourceTags = async (subPost: SubPost, studyId: string) =>
  withServerResponse('getDefaultEmissionSourceTag', async () => {
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

    if (!(account.environment in emissionSourceTagMap)) {
      return []
    }
    const tagObj = emissionSourceTagMap[account.environment]
    if (!tagObj) {
      return []
    }
    const studyTags =
      study.emissionSourceTagFamilies.reduce(
        (tags, family) => tags.concat(family.emissionSourceTags),
        [] as EmissionSourceTag[],
      ) || ([] as EmissionSourceTag[])

    const defaultTags = []
    for (const tag of Object.keys(tagObj)) {
      if (tagObj[tag as DefaultEmissionSourceTag]?.includes(subPost)) {
        const tagData = studyTags?.find((studyTag) => studyTag.name === tag)
        if (tagData) {
          defaultTags.push(tagData.id)
        }
      }
    }
    return defaultTags
  })

export const createOrUpdateEmissionSourceTagFamily = async (studyId: string, name: string, familyId?: string) =>
  withServerResponse('createOrUpdateEmissionSourceTagFamily', async () => {
    const account = await auth()
    if (!account || !account.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await hasAccessToCreateEmissionSourceTag(account.user.environment))) {
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
    return upsertEmissionSourceTagFamilyById(studyId, name, familyId)
  })

export const deleteEmissionSourceTagFamily = async (studyId: string, familyId: string) =>
  withServerResponse('deleteEmissionSourceTagFamily', async () => {
    const account = await auth()
    if (!account || !account.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    if (!(await hasAccessToCreateEmissionSourceTag(account.user.environment))) {
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

    return removeSourceTagFamilyById(familyId)
  })
