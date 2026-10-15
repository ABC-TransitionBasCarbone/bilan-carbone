import { createStudyEmissionFactorVersionIfAbsent, getSourceLatestImportVersionId } from '@/db/study'
import { isSourceForEnv } from '@/services/importEmissionFactor/import'
import { Environment, Import } from '@abc-transitionbascarbone/common/db/enums'

export const addSourceToStudy = async (source: Import, studyId: string, environment: Environment) => {
  if (!(await isSourceForEnv(environment)).includes(source)) {
    return
  }

  const importVersion = await getSourceLatestImportVersionId(source)
  if (importVersion) {
    await createStudyEmissionFactorVersionIfAbsent({ studyId, source, importVersionId: importVersion.id })
  }
}
