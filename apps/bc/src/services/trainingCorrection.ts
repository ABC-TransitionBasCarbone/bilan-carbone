import { prismaClient } from '@/db/client'
import { FullStudy, getStudyById, getStudyTemplates } from '@/db/study'
import type { Prisma, Site } from '@abc-transitionbascarbone/common/db'
import { DuplicableStudy, Environment, Import, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { DAY, TIME_IN_MS } from '@abc-transitionbascarbone/common/utils'
import {
  getEnvironmentHandlingGenericEnvs,
  isCourseEnvironment,
} from '@abc-transitionbascarbone/common/utils/environments'
import { normalizeString } from '@abc-transitionbascarbone/common/utils/parsing'
import { isDeepStrictEqual } from 'node:util'
import { v4 as uuidv4 } from 'uuid'
import { duplicateTrainingStudy } from './studyDuplication'

const correctionFactorFields = {
  omit: { createdAt: true, updatedAt: true, oldBCId: true, importedId: true },
  include: {
    metaData: { omit: { emissionFactorId: true, createdAt: true, updatedAt: true } },
    emissionFactorParts: {
      omit: { id: true, emissionFactorId: true, createdAt: true, updatedAt: true, oldBCId: true },
      include: {
        metaData: { omit: { emissionFactorPartId: true, createdAt: true, updatedAt: true } },
      },
    },
  },
} as const satisfies Prisma.EmissionFactorDefaultArgs

type CorrectionFactor = Prisma.EmissionFactorGetPayload<typeof correctionFactorFields>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const factorData = ({ id, organizationId, ...data }: CorrectionFactor) => data

const translationsByLanguage = <T extends { language: string }>(translations: T[]) =>
  Object.fromEntries(translations.map((translation) => [translation.language, translation]))

const sameFactorContent = (left: CorrectionFactor, right: CorrectionFactor) => {
  const { subPosts, metaData, emissionFactorParts, ...fields } = factorData(left)
  const {
    subPosts: rightSubPosts,
    metaData: rightMetaData,
    emissionFactorParts: rightParts,
    ...rightFields
  } = factorData(right)
  if (
    !isDeepStrictEqual(fields, rightFields) ||
    !isDeepStrictEqual([...subPosts].sort(), [...rightSubPosts].sort()) ||
    !isDeepStrictEqual(translationsByLanguage(metaData), translationsByLanguage(rightMetaData)) ||
    emissionFactorParts.length !== rightParts.length
  ) {
    return false
  }

  const unmatchedParts = rightParts.map(({ metaData, ...part }) => ({
    ...part,
    metaData: translationsByLanguage(metaData),
  }))
  return emissionFactorParts.every(({ metaData, ...part }) => {
    const data = { ...part, metaData: translationsByLanguage(metaData) }
    const index = unmatchedParts.findIndex((candidate) => isDeepStrictEqual(data, candidate))
    if (index === -1) {
      return false
    }
    unmatchedParts.splice(index, 1)
    return true
  })
}

const copyCorrectionManualEmissionFactors = async (
  studies: FullStudy[],
  organizationId: string,
  transaction: Prisma.TransactionClient,
) => {
  const ids = [
    ...new Set(
      studies.flatMap(({ emissionSources }) =>
        emissionSources.flatMap(({ emissionFactor }) =>
          emissionFactor?.importedFrom === Import.Manual ? [emissionFactor.id] : [],
        ),
      ),
    ),
  ]
  const copies = new Map<string, string>()
  if (ids.length === 0) {
    return copies
  }

  const factors = await transaction.emissionFactor.findMany({
    where: { importedFrom: Import.Manual, OR: [{ id: { in: ids } }, { organizationId }] },
    orderBy: { id: 'asc' },
    ...correctionFactorFields,
  })
  const factorsById = new Map(factors.map((factor) => [factor.id, factor]))
  const candidates = factors.filter((factor) => factor.organizationId === organizationId)
  for (const id of ids) {
    const source = factorsById.get(id)
    if (!source) {
      throw new Error(
        `Missing manual emission factor ${id} while copying corrections for organization ${organizationId}`,
      )
    }
    if (source.organizationId === organizationId) {
      continue
    }
    const existing = candidates.find((candidate) => sameFactorContent(source, candidate))
    if (existing) {
      copies.set(id, existing.id)
      continue
    }
    const { metaData, emissionFactorParts, ...factor } = factorData(source)
    const copy = await transaction.emissionFactor.create({
      data: {
        ...factor,
        organizationId,
        metaData: { create: metaData },
        emissionFactorParts: {
          create: emissionFactorParts.map(({ metaData, ...part }) => ({ ...part, metaData: { create: metaData } })),
        },
      },
      select: { id: true },
    })
    copies.set(id, copy.id)
    candidates.push({ ...source, id: copy.id, organizationId })
  }
  return copies
}

export const ensureProfessorCorrectionClient = async (
  professorOrganizationVersionId: string,
  environment: Environment,
  transaction: Prisma.TransactionClient,
) => {
  if (!isCourseEnvironment(environment)) {
    console.error(`Cannot create professor corrections outside training environments: ${environment}`)
    return
  }
  const existingClient = await transaction.organizationVersion.findFirst({
    where: { parentId: professorOrganizationVersionId, environment },
    select: { id: true, organizationId: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
  const sourceEnvironment = getEnvironmentHandlingGenericEnvs(environment)
  const templates = await getStudyTemplates(DuplicableStudy.TrainingCorrectionExercise, sourceEnvironment, transaction)
  if (templates.length === 0) {
    console.error(`No TrainingCorrectionExercise template configured for ${sourceEnvironment}`)
    return
  }
  const existingCopies = existingClient
    ? await transaction.study.findMany({
        where: {
          organizationVersionId: existingClient.id,
          sourceTemplateStudyId: { in: templates.map(({ studyId }) => studyId) },
        },
        select: { sourceTemplateStudyId: true },
      })
    : []
  const copiedTemplateIds = new Set(existingCopies.map(({ sourceTemplateStudyId }) => sourceTemplateStudyId))
  const missingTemplates = templates.filter(({ studyId }) => !copiedTemplateIds.has(studyId))
  if (existingClient && missingTemplates.length === 0) {
    return { id: existingClient.id }
  }
  const account = await transaction.account.findFirst({
    where: { organizationVersionId: professorOrganizationVersionId, environment },
    select: { id: true, organizationVersion: { select: { organizationId: true } } },
    orderBy: { createdAt: 'asc' },
  })
  if (!account?.organizationVersion) {
    console.error(`Professor account not found for organization ${professorOrganizationVersionId} in ${environment}`)
    return
  }
  const studies: FullStudy[] = []
  const sites = new Map<string, Site>()
  for (const template of missingTemplates) {
    const study = await getStudyById(template.studyId, null, transaction)
    if (!study || study.organizationVersion.environment !== sourceEnvironment) {
      console.error(`Invalid TrainingCorrectionExercise study ${template.studyId} for ${sourceEnvironment}`)
      return
    }
    studies.push(study)
    const organization = await transaction.organization.findUnique({
      where: { id: study.organizationVersion.organization.id },
      select: { sites: { orderBy: { createdAt: 'asc' } } },
    })
    if (!organization) {
      console.error(`Template organization not found for study ${study.id}`)
      return
    }
    for (const site of organization.sites) {
      sites.set(site.id, site)
    }
  }
  const sourceSites = [...sites.values()]
  const sourceNames = new Set(sourceSites.map((site) => normalizeString(site.name)))
  const existingSites = existingClient
    ? (
        await transaction.site.findMany({
          where: { organizationId: existingClient.organizationId },
          select: { id: true, name: true },
        })
      ).filter((site) => sourceNames.has(normalizeString(site.name)))
    : []
  if (
    sourceNames.size !== sourceSites.length ||
    new Set(existingSites.map((site) => normalizeString(site.name))).size !== existingSites.length
  ) {
    console.error('ensureProfessorCorrectionClient: ambiguous site names', { professorOrganizationVersionId })
    throw new Error('Ambiguous correction site names')
  }
  const siteIds = new Map(
    sourceSites.map((site) => [
      site.id,
      existingSites.find((copy) => normalizeString(copy.name) === normalizeString(site.name))?.id ?? uuidv4(),
    ]),
  )
  const copiedSites = sourceSites
    .filter((site) => !existingSites.some((copy) => normalizeString(copy.name) === normalizeString(site.name)))
    .map((site) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, organizationId, oldBCId, createdAt, updatedAt, ...data } = site
      return { ...data, id: siteIds.get(id) }
    })
  const client =
    existingClient ??
    (await transaction.organizationVersion.create({
      data: {
        environment,
        parent: { connect: { id: professorOrganizationVersionId } },
        organization: {
          create: {
            name: 'Etudes corrigées',
            sites: {
              createMany: {
                data: copiedSites,
              },
            },
          },
        },
      },
      select: { id: true },
    }))
  if (existingClient && copiedSites.length > 0) {
    await transaction.site.createMany({
      data: copiedSites.map((site) => ({ ...site, organizationId: existingClient.organizationId })),
    })
  }
  const emissionFactorIds = await copyCorrectionManualEmissionFactors(
    studies,
    account.organizationVersion.organizationId,
    transaction,
  )
  for (const study of studies) {
    await duplicateTrainingStudy(
      study,
      [{ id: account.id, environment }],
      StudyRole.Validator,
      transaction,
      undefined,
      {
        organizationVersionId: client.id,
        siteIds,
        emissionFactorIds,
      },
    )
  }
  return { id: client.id }
}

export const ensureCourseProfessorCorrections = async () => {
  const twoWeeksAgo = new Date(Date.now() - 14 * DAY * TIME_IN_MS)
  const professors = await prismaClient.organizationVersion.findMany({
    where: {
      environment: { in: [Environment.COURSE_BC, Environment.COURSE_TILT] },
      professorCourseSessions: { some: { endDate: { gt: twoWeeksAgo } } },
    },
    select: { id: true, environment: true },
  })
  for (const professor of professors) {
    try {
      await prismaClient.$transaction(
        (transaction) => ensureProfessorCorrectionClient(professor.id, professor.environment, transaction),
        { isolationLevel: 'Serializable' },
      )
    } catch (error) {
      console.error('Error creating correction studies for professor:', {
        professorOrganizationVersionId: professor.id,
        environment: professor.environment,
        error,
      })
    }
  }
}
