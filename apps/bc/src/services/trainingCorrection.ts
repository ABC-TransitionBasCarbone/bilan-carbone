import { FullStudy, getStudyById, getStudyTemplates } from '@/db/study'
import type { Prisma, Site } from '@abc-transitionbascarbone/common/db'
import { DuplicableStudy, Environment, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { DAY, TIME_IN_MS } from '@abc-transitionbascarbone/common/utils'
import {
  getEnvironmentHandlingGenericEnvs,
  isCourseEnvironment,
} from '@abc-transitionbascarbone/common/utils/environments'
import { normalizeString } from '@abc-transitionbascarbone/common/utils/parsing'
import { v4 as uuidv4 } from 'uuid'
import { duplicateTrainingStudy } from './studyDuplication'

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
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })
  if (!account) {
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
      },
    )
  }
  return { id: client.id }
}

export const ensureCourseProfessorCorrections = async (transaction: Prisma.TransactionClient) => {
  const twoWeeksAgo = new Date(Date.now() - 14 * DAY * TIME_IN_MS)
  const professors = await transaction.organizationVersion.findMany({
    where: {
      environment: { in: [Environment.COURSE_BC, Environment.COURSE_TILT] },
      professorCourseSessions: { some: { endDate: { gt: twoWeeksAgo } } },
    },
    select: { id: true, environment: true },
  })
  for (const professor of professors) {
    await ensureProfessorCorrectionClient(professor.id, professor.environment, transaction)
  }
}
