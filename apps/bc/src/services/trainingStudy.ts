import { prismaClient } from '@/db/client'
import { getStudyById, getStudyTemplates, upsertStudyTemplate } from '@/db/study'
import { groupBy } from '@/utils/array'
import { DuplicableStudy, Environment, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { duplicateTrainingStudy } from './studyDuplication'

export const setStudyTemplate = async (template: DuplicableStudy, environment: Environment, studyId: string) => {
  const study = await getStudyById(studyId, null)
  if (!study) {
    throw new Error('Study not found')
  }
  if (study.organizationVersion.environment !== environment) {
    throw new Error(`Study is not from the right environment (${study.organizationVersion.environment})`)
  }
  if (study.organizationVersion.organization.id !== process.env.STUDY_TEMPLATE_ORGANIZATION_ID) {
    throw new Error(`Study is not from the right organization (${study.organizationVersion.organization.name})`)
  }
  await upsertStudyTemplate(template, environment, studyId)
}

const duplicateStudyTemplateForAccounts = async (
  accounts: { id: string; environment: Environment }[],
  studyId: string,
  role: StudyRole,
  nameSuffix?: string,
) => {
  const study = await getStudyById(studyId, null)
  const environment = accounts[0].environment
  if (!study || study.organizationVersion.environment !== environment) {
    console.error('duplicateStudyTemplateForAccounts: invalid template', { studyId, environment })
    throw new Error(NOT_AUTHORIZED)
  }
  await prismaClient.$transaction((tx) => duplicateTrainingStudy(study, accounts, role, tx, nameSuffix))
}

export const assignTrainingExerciseStudy = async (): Promise<{ created: number; error: number }> => {
  let created = 0
  let error = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const targetAccounts = await prismaClient.account.findMany({
    // Historical TILT learner assignments are paused; professor imports handle corrections.
    where: { formationStartDate: { gte: today, lt: tomorrow }, environment: { not: Environment.TILT } },
    select: { id: true, environment: true, user: { select: { firstName: true, lastName: true } } },
  })
  for (const account of targetAccounts) {
    const studyTemplates = await getStudyTemplates(DuplicableStudy.TrainingExercise, account.environment)
    for (const studyTemplate of studyTemplates) {
      try {
        await duplicateStudyTemplateForAccounts(
          [account],
          studyTemplate.studyId,
          StudyRole.Validator,
          ` - ${account.user.firstName} ${account.user.lastName}`,
        )
        created++
      } catch (e) {
        console.log(
          `An error occured during the assignment of study ${studyTemplate.studyId} to account ${account.id} in the environment ${account.environment} : ${e}`,
        )
        error++
      }
    }
  }
  return { created, error }
}

export const assignTrainingCorrectionExerciseStudy = async () => {
  const created = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const targetAccounts = await prismaClient.account.findMany({
    where: { formationEndDate: { gte: today, lt: tomorrow }, environment: { not: Environment.TILT } },
    select: { id: true, environment: true, formationName: true, user: { select: { firstName: true, lastName: true } } },
  })
  const groupedByEnv = groupBy(targetAccounts, 'environment')
  for (const [environment, envAccounts] of Object.entries(groupedByEnv)) {
    const groupedByFormationName = groupBy(envAccounts, 'formationName')
    const studyTemplates = await getStudyTemplates(
      DuplicableStudy.TrainingCorrectionExercise,
      environment as Environment,
    )
    for (const studyTemplate of studyTemplates) {
      for (const [formationName, accounts] of Object.entries(groupedByFormationName)) {
        await duplicateStudyTemplateForAccounts(
          accounts,
          studyTemplate.studyId,
          StudyRole.Reader,
          ` - ${formationName}`,
        )
        created.push(formationName)
      }
    }
  }
  return created
}
