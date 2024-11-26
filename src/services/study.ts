import { FullStudy } from '@/db/study'
import { Level, SubPost } from '@prisma/client'
import { saveAs } from 'file-saver'
import { EmissionFactorWithMetaData } from './emissionFactors'
import { StudyWithoutDetail } from './permissions/study'
import { getQualityRating } from './uncertainty'

const QualityMatrix = {
  1: 'Très mauvaise',
  2: 'Mauvaise',
  3: 'Moyenne',
  4: 'Bonne',
  5: 'Très bonne',
}

const getQuality = (quality: ReturnType<typeof getQualityRating>) => {
  if (quality === null) {
    return 'Inconnue'
  }
  return QualityMatrix[quality]
}

export enum NewStudyRightStatus {
  SameOrganization,
  OtherOrganization,
  NonExisting,
}

export const getAllowedLevels = (level: Level | null) => {
  switch (level) {
    case Level.Advanced:
      return [Level.Initial]
    case Level.Standard:
      return [Level.Initial, Level.Standard]
    case Level.Initial:
      return [Level.Initial, Level.Standard, Level.Advanced]
    default:
      return []
  }
}

export enum EmissionSourcesStatus {
  Valid = 'valid',
  ToVerify = 'toVerify',
  Waiting = 'waiting',
  WaitingContributor = 'waitingContributor',
}

export const getEmissionSourceStatus = (
  study: FullStudy | StudyWithoutDetail,
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
) => {
  if (emissionSource.validated) {
    return EmissionSourcesStatus.Valid
  }

  if (emissionSource.value !== null && emissionSource.emissionFactor !== null) {
    return EmissionSourcesStatus.ToVerify
  }

  if (study.contributors && study.contributors.some((contributor) => contributor.subPost === emissionSource.subPost)) {
    return EmissionSourcesStatus.WaitingContributor
  }

  return EmissionSourcesStatus.Waiting
}

export const downloadStudySubPosts = (
  study: FullStudy | StudyWithoutDetail,
  post: string,
  subPost: SubPost,
  emissionSources: FullStudy['emissionSources'] | StudyWithoutDetail['emissionSources'],
  emissionFactors: EmissionFactorWithMetaData[],
) => {
  const columns = [
    "Validation de la source d'émission",
    "Nom de la source d'émission",
    "Caractérisation de la source d'émission",
    "Valeur de la source d'émission",
    "Commentaire de la source d'émission",
    "Qualité de la source d'émission",
    "Nom du FE (facteur d'émission)",
    'Valeur du FE',
    'Source du FE',
    'Qualité du FE',
  ].join(',')

  const csvRows = emissionSources.map((emissionSource) => {
    const emissionFactor = emissionFactors.find((factor) => factor.id === emissionSource.emissionFactor?.id)

    return [
      emissionSource.validated ? 'Oui' : 'Non',
      emissionSource.name || '',
      emissionSource.caracterisation || '',
      emissionSource.value || '0',
      emissionSource.comment || '',
      getQuality(getQualityRating(emissionSource)),
      emissionFactor?.metaData?.title || 'Aucun facteur',
      emissionFactor?.totalCo2 || '',
      emissionFactor?.source || '',
      emissionFactor ? getQuality(getQualityRating(emissionFactor)) : '',
    ].join(',')
  })
  const totalEmissions = emissionSources.reduce((sum, item) => sum + (item.value || 0), 0)
  const totalRow = ['TOTAL', '', '', totalEmissions].join(',')

  // TO DO : Ajouter la ligne des incertitudes
  const csvContent = [columns, ...csvRows, totalRow].join('\n')

  const currentDate = new Date()
  const getDay = (day: number) => (day < 10 ? `0${day}` : day)
  const dateString = `${currentDate.getFullYear()}_${currentDate.getMonth() + 1}_${getDay(currentDate.getDate())}`
  const fileName = `${study.name}_${post}_${subPost}_${dateString}.csv`

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, fileName)
}
