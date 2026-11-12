import { FullStudy, getStudyById, getStudyTemplates } from '@/db/study'
import type { Prisma, Site } from '@abc-transitionbascarbone/common/db'
import { DuplicableStudy, Environment, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import {
  getEnvironmentHandlingGenericEnvs,
  isCourseEnvironment,
} from '@abc-transitionbascarbone/common/utils/environments'
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
    select: { id: true },
  })
  if (existingClient) {
    return existingClient
  }

  const sourceEnvironment = getEnvironmentHandlingGenericEnvs(environment)
  const templates = await getStudyTemplates(DuplicableStudy.TrainingCorrectionExercise, sourceEnvironment, transaction)
  if (templates.length === 0) {
    console.error(`No TrainingCorrectionExercise template configured for ${sourceEnvironment}`)
    return
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
  for (const template of templates) {
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
  const siteIds = new Map([...sites.keys()].map((id) => [id, uuidv4()]))
  const client = await transaction.organizationVersion.create({
    data: {
      environment,
      parent: { connect: { id: professorOrganizationVersionId } },
      organization: {
        create: {
          name: 'Etudes corrigées',
          sites: {
            createMany: {
              data: [...sites.values()].map((site) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, organizationId, oldBCId, createdAt, updatedAt, ...data } = site
                return { ...data, id: siteIds.get(id) }
              }),
            },
          },
        },
      },
    },
    select: { id: true },
  })
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
  return client
}
