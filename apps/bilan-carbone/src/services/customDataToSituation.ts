import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { SimplifiedEnvironment } from './publicodes/simplifiedPublicodesConfig'

export interface TiltCustomDataFields {
  postalCode?: string | undefined
  structure?: string | undefined
  structureOther?: string | undefined
}

export const mappedTiltSituationToCustomDataFields: Record<string, keyof TiltCustomDataFields> = {
  'général . code postal': 'postalCode',
  'général . type': 'structure',
}

export const optionalTiltSituationToCustomDataFields: Record<string, keyof TiltCustomDataFields> = {
  'général . type autre': 'structureOther',
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
  "'Autre'",
]

export const TILT_STRUCTURE_OTHER_VALUE = "'Autre'"

export const customDataToSituationByEnvironment = (
  environment: SimplifiedEnvironment,
  data: TiltCustomDataFields | undefined,
): Record<string, string | null> => {
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

const getTiltSituation = (data: TiltCustomDataFields | undefined): Record<string, string | null> => {
  if (!data) {
    return {}
  }

  const situation: Record<string, string | null> = {}

  if (data.postalCode != null) {
    situation['général . code postal'] = data.postalCode
  }
  if (data.structure != null) {
    situation['général . type'] = data.structure
  }
  if (data.structureOther !== undefined) {
    // Add single quotes to the structure value to avoid parsing errors in publicodes
    situation['général . type autre'] = data.structureOther === '' ? null : `'${data.structureOther}'`
  }

  return situation
}
