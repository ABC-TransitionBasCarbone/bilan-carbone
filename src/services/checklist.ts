import { UserChecklist } from '@prisma/client'

export const mandatoryParentSteps = (step: UserChecklist, isCr: boolean) => {
  switch (step) {
    case UserChecklist.AddSiteCR:
      return [UserChecklist.AddClient]
    case UserChecklist.CreateFirstStudy:
      return isCr ? [UserChecklist.AddSiteCR] : [UserChecklist.AddSiteOrga]
    case UserChecklist.CreateFirstEmissionSource:
    case UserChecklist.ConsultResults:
      return [UserChecklist.CreateFirstStudy]
    default:
      return []
  }
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
