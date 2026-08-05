import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { EnvironmentWithSimplifiedStudies } from './permissions/environment'
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
  "'Structure sportive'",
  "'Club de loisirs'",
  "'Éducation, formation et insertion professionnelle'",
  "'Développement économique et local'",
  "'Développement international et humanitaire'",
  "'Culture et patrimoine'",
  "'Association de voisinage",
  "'Hôpital",
  "'Maison de retraite",
  "'Association d'aide à domicile'",
  "'Accompagnement des personnes en situation de handicap'",
  "'Protection de l'enfance",
  "'Autres structures sociales et solidaires'",
  "'Défense de l'environnement'",
  "'Autre'",
]

export const customDataToSituationByEnvironment = (
  environment: EnvironmentWithSimplifiedStudies,
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
