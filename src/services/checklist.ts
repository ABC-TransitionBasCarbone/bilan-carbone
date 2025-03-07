import { CRUserChecklist } from '@prisma/client'

export const isOptionnalStep = (step: CRUserChecklist) => step === CRUserChecklist.AddCollaborator

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
