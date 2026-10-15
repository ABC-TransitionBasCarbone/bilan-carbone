import {
  createEmissionFactorWithParts as createEmissionFactorWithPartsInDb,
  updateEmissionFactor,
} from '@/db/emissionFactors'
import { getOrgVersionWithOrgId } from '@/db/organization'
import { EmissionFactorCommand, UpdateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { isMonetaryEmissionFactor } from '@/utils/emissionFactors'
import { flattenSubposts } from '@/utils/post'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { EmissionFactorStatus, Import, Unit } from '@abc-transitionbascarbone/common/db/enums'
import { LocaleType } from '@abc-transitionbascarbone/common/i18n/config'
import { Session } from 'next-auth'

const createPartData = (parts: EmissionFactorCommand['parts'], language: LocaleType) =>
  parts.map(({ name, ...part }) => ({
    ...part,
    metaData: { create: { language, title: name } },
  }))

export const createEmissionFactorWithParts = (
  emissionFactor: Prisma.EmissionFactorCreateInput,
  parts: EmissionFactorCommand['parts'],
  language: LocaleType,
) =>
  createEmissionFactorWithPartsInDb(
    { ...emissionFactor, isMonetary: isMonetaryEmissionFactor(emissionFactor) },
    createPartData(parts, language),
  )

export const updateManualEmissionFactor = async (
  session: Session,
  language: LocaleType,
  { id, name, unit, attribute, comment, parts, subPosts, ...command }: UpdateEmissionFactorCommand,
) => {
  const accountOrganizationVersion = await getOrgVersionWithOrgId(session.user.organizationVersionId)
  const emissionFactor: Prisma.EmissionFactorUpdateInput = {
    ...command,
    importedFrom: Import.Manual,
    status: EmissionFactorStatus.Valid,
    organization: { connect: { id: accountOrganizationVersion?.organizationId } },
    unit: unit as Unit,
    isMonetary: isMonetaryEmissionFactor(command),
    subPosts: flattenSubposts(subPosts),
  }
  const metaData: Prisma.EmissionFactorMetaDataCreateWithoutEmissionFactorInput = {
    language,
    title: name,
    attribute,
    comment,
  }

  return updateEmissionFactor(id, emissionFactor, metaData, createPartData(parts, language))
}
