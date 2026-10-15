import { getStudyEmissionSourceValidationGroups } from '@/db/study'

export const getStudiesValidatedEmissionsSources = async (ids: string[]) => {
  const groups = await getStudyEmissionSourceValidationGroups(ids)
  const result: Record<string, { total: number; validated: number }> = Object.fromEntries(
    ids.map((id) => [id, { total: 0, validated: 0 }]),
  )

  for (const group of groups) {
    result[group.studyId].total += group._count
    if (group.validated) {
      result[group.studyId].validated += group._count
    }
  }
  return result
}
