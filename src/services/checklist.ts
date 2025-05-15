import { hasEditionRole } from '@/utils/organization'
import { isAdmin } from '@/utils/user'
import { Role, UserChecklist } from '@prisma/client'

export const mandatoryParentSteps = (step: UserChecklist, userRole: Role, isCr: boolean) => {
  let steps: UserChecklist[]
  switch (step) {
    case UserChecklist.AddSiteCR:
      steps = [UserChecklist.AddClient]
      break
    case UserChecklist.CreateFirstStudy:
      steps = isCr ? [UserChecklist.AddSiteCR] : [UserChecklist.AddSiteOrga]
      break
    case UserChecklist.CreateFirstEmissionSource:
    case UserChecklist.ConsultResults:
      steps = [UserChecklist.CreateFirstStudy]
      break
    default:
      steps = []
      break
  }
  return getUserCheckList(userRole, isCr).filter((step) => steps.includes(step))
}

export const getLink = (step: UserChecklist, studyId?: string) => {
  switch (step) {
    case UserChecklist.AddCollaborator:
      return '/equipe'
    case UserChecklist.AddClient:
      return '/organisations/creer'
    case UserChecklist.CreateFirstStudy:
      return '/etudes/creer'
    case UserChecklist.CreateFirstEmissionSource:
      return studyId ? `/etudes/${studyId}/comptabilisation/saisie-des-donnees` : null
    case UserChecklist.ConsultResults:
      return studyId ? `/etudes/${studyId}/comptabilisation/resultats` : null
    default:
      return null
  }
}

export const OrgaUserChecklist: UserChecklist[] = [
  UserChecklist.CreateAccount,
  UserChecklist.AddCollaborator,
  UserChecklist.AddSiteOrga,
  UserChecklist.CreateFirstStudy,
  UserChecklist.CreateFirstEmissionSource,
  UserChecklist.ConsultResults,
  UserChecklist.Completed,
]

export const CRUserChecklist: UserChecklist[] = [
  UserChecklist.CreateAccount,
  UserChecklist.AddCollaborator,
  UserChecklist.AddClient,
  UserChecklist.AddSiteCR,
  UserChecklist.CreateFirstStudy,
  UserChecklist.CreateFirstEmissionSource,
  UserChecklist.ConsultResults,
  UserChecklist.Completed,
]

export const getUserCheckList = (userRole: Role, isCR: boolean) => {
  const checklist = isCR ? CRUserChecklist : OrgaUserChecklist
  return checklist.filter(
    (step) =>
      (step !== UserChecklist.AddCollaborator || isAdmin(userRole) || userRole === Role.GESTIONNAIRE) &&
      (step !== UserChecklist.AddSiteOrga || hasEditionRole(isCR, userRole)) &&
      (step !== UserChecklist.AddSiteCR || hasEditionRole(isCR, userRole)),
  )
}
