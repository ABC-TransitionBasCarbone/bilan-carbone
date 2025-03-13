import { CRUserChecklist } from '@prisma/client'

export const mandatorySteps = (step: CRUserChecklist) => {
  switch (step) {
    case CRUserChecklist.AddSite:
      return [CRUserChecklist.AddClient]
    case CRUserChecklist.CreateFirstStudy:
      return [CRUserChecklist.AddSite]
    case CRUserChecklist.CreateFirstEmissionSource:
    case CRUserChecklist.ConsultResults:
      return [CRUserChecklist.CreateFirstStudy]
    default:
      return []
  }
}

export const getLink = (step: CRUserChecklist, studyId?: string) => {
  switch (step) {
    case CRUserChecklist.AddCollaborator:
      return '/equipe'
    case CRUserChecklist.AddClient:
      return '/organisations/creer'
    case CRUserChecklist.CreateFirstStudy:
      return '/etudes/creer'
    case CRUserChecklist.CreateFirstEmissionSource:
      return studyId ? `/etudes/${studyId}/comptabilisation/saisie-des-donnees` : null
    case CRUserChecklist.ConsultResults:
      return studyId ? `/etudes/${studyId}/comptabilisation/resultats` : null
    default:
      return null
  }
}
