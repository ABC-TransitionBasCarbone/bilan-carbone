import { Environment } from '@prisma/client'
import { Situation } from 'publicodes'
import { SimplifiedEnvironment } from './publicodes/simplifiedPublicodesConfig'

export interface TiltCustomDataFields {
  postalCode?: string | undefined
  structure?: string | undefined
}

export const mappedTiltSituationToCustomDataFields: Record<string, keyof TiltCustomDataFields> = {
  'général . code postal': 'postalCode',
  'général . type': 'structure',
}

export const TiltStructureOptions: string[] = [
  "'Club de loisirs'",
  "'Association étudiante'",
  "'Association culturelle'",
  "'Association de voisinage'",
  "'Hôpital'",
  "'Maison de retraite'",
  "'Association d'aide à domicile'",
  "'Association humanitaire'",
  "'Autres structures sociales et solidaires'",
  "'Association de défense de l'environnement'",
  "'Association d'enseignement ou de formation'",
]

export const customDataToSituationByEnvironment = (
  environment: SimplifiedEnvironment,
  data: TiltCustomDataFields | undefined,
): Situation<string> => {
  switch (environment) {
    case Environment.CUT:
    case Environment.CLICKSON:
      return {}
    case Environment.TILT:
      return getTiltSituation(data as TiltCustomDataFields | undefined)
    default:
      return {}
  }
}

const getTiltSituation = (data: TiltCustomDataFields | undefined): Situation<string> => {
  if (!data) {
    return {}
  }

  const situation: Situation<string> = {}

  if (data.postalCode != null) {
    situation['général . code postal'] = data.postalCode
  }
  if (data.structure != null) {
    situation['général . type'] = data.structure
  }

  return situation
}
