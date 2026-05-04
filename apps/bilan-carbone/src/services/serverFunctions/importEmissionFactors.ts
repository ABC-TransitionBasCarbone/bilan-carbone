'use server'

import { getAccountById } from '@/db/account'
import { createEmissionFactorWithParts, getManualEmissionFactorsByOrganization } from '@/db/emissionFactors'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { AccountWithUser } from '@/types/account.types'
import {
  ImportEmissionFactorsResult,
  ParsedRow,
  PreviewEmissionFactorsResult,
  PreviewRow,
} from '@/types/importEmissionFactors.types'
import { buildPostsAndSubPostsCell, getUnitLabel, parseImportFile } from '@/utils/importEmissionFactors.utils'
import { flattenSubposts } from '@/utils/post'
import { withServerResponse } from '@/utils/serverResponse'
import { getBcTranslations } from '@/utils/translation.utils'
import { EmissionFactorStatus, Import } from '@repo/db-common/enums'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canReadEmissionFactor } from '../permissions/emissionFactor'
import { canCreateEmissionFactor } from '../permissions/emissionFactor.server'
import { prepareExcel } from './file'
import { getFileUrlFromBucket } from './scaleway'

async function checkAuth(requireCreatePermission = true): Promise<AccountWithUser> {
  const session = await auth()
  if (!session?.user) {
    throw new Error(NOT_AUTHORIZED)
  }

  const account = await getAccountById(session.user.accountId)
  if (!account?.organizationVersionId || !account.organizationVersion) {
    throw new Error(NOT_AUTHORIZED)
  }

  // This way TS knows that the organizationVersion is not null
  const accountWithOrgVersion = { ...account, organizationVersion: account.organizationVersion }

  if (requireCreatePermission) {
    if (!(await canCreateEmissionFactor(account.organizationVersionId))) {
      throw new Error(NOT_AUTHORIZED)
    }
  } else {
    if (
      !canReadEmissionFactor(accountWithOrgVersion, {
        organizationId: account.organizationVersion.organizationId,
        importedFrom: Import.Manual,
      })
    ) {
      throw new Error(NOT_AUTHORIZED)
    }
  }

  return accountWithOrgVersion
}

export async function previewEmissionFactorsFromFile(file: File): Promise<PreviewEmissionFactorsResult> {
  const account = await checkAuth()

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseImportFile(buffer, locale, account.environment)

  if (!result.success) {
    return result
  }

  const rows: PreviewRow[] = result.rows.map((row) => ({
    name: row.name,
    source: row.source,
    unit: row.rawUnit,
    totalCo2: row.totalCo2,
    postsAndSubPosts: row.rawPostsAndSubPosts,
  }))

  return { success: true, rows }
}

function buildCreateInput(row: ParsedRow, organizationId: string, locale: LocaleType) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, attribute, comment, subPosts, parts, rawPostsAndSubPosts, rawUnit, ...command } = row
  return {
    data: {
      ...command,
      importedFrom: Import.Manual,
      status: EmissionFactorStatus.Valid,
      organization: { connect: { id: organizationId } },
      subPosts: flattenSubposts(subPosts),
      metaData: { create: { language: locale, title: name, attribute, comment } },
    },
    parts,
    locale,
  }
}

export async function importEmissionFactorsFromFile(file: File): Promise<ImportEmissionFactorsResult> {
  const account = await checkAuth()

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseImportFile(buffer, locale, account.environment)

  if (!result.success) {
    return result
  }
  const organizationId = account.organizationVersion.organizationId

  for (const row of result.rows) {
    const { data, parts, locale: rowLocale } = buildCreateInput(row, organizationId, locale)
    await createEmissionFactorWithParts(data, parts, rowLocale)
  }

  return { success: true, count: result.rows.length }
}

export async function exportManualEmissionFactorsToFile(): Promise<ArrayBuffer> {
  const account = await checkAuth(false)
  const locale = await getLocale()
  const bc = getBcTranslations(locale)
  const baseTranslations = bc.emissionFactors.base
  const qualityTranslations = bc.quality as Record<string, string>

  const organizationId = account.organizationVersion.organizationId
  const emissionFactors = await getManualEmissionFactorsByOrganization(organizationId)

  const c = bc.emissionFactors.create
  const tbl = bc.emissionFactors.table
  const header = [
    c.name,
    c.attribute,
    c.unit,
    c.customUnit,
    c.source,
    c.location,
    tbl.technicalRepresentativeness.replace(/ :$/, ''),
    tbl.geographicRepresentativeness.replace(/ :$/, ''),
    tbl.temporalRepresentativeness.replace(/ :$/, ''),
    tbl.completeness.replace(/ :$/, ''),
    tbl.reliability.replace(/ :$/, ''),
    c.comment,
    c.totalCo2,
    c.co2f,
    c.ch4f,
    c.ch4b,
    c.n2o,
    c.co2b,
    c.sf6,
    c.hfc,
    c.pfc,
    c.otherGES,
    c.post,
    c.base,
  ]
  const rows: (string | number)[][] = emissionFactors.map((ef) => {
    const metaData = ef.metaData.find((m) => m.language === locale) ?? ef.metaData[0]
    return [
      metaData?.title ?? '',
      metaData?.attribute ?? '',
      ef.unit ? getUnitLabel(ef.unit, locale) : '',
      ef.customUnit ?? '',
      ef.source ?? '',
      ef.location ?? '',
      qualityTranslations[String(ef.technicalRepresentativeness)] ?? '',
      qualityTranslations[String(ef.geographicRepresentativeness)] ?? '',
      qualityTranslations[String(ef.temporalRepresentativeness)] ?? '',
      qualityTranslations[String(ef.completeness)] ?? '',
      qualityTranslations[String(ef.reliability)] ?? '',
      metaData?.comment ?? '',
      ef.totalCo2,
      ef.co2f ?? '',
      ef.ch4f ?? '',
      ef.ch4b ?? '',
      ef.n2o ?? '',
      ef.co2b ?? '',
      ef.sf6 ?? '',
      ef.hfc ?? '',
      ef.pfc ?? '',
      ef.otherGES ?? '',
      buildPostsAndSubPostsCell(ef.subPosts, locale, account.environment),
      ef.base ? (baseTranslations[ef.base] ?? ef.base) : '',
    ]
  })

  return prepareExcel([{ name: "Facteurs d'émission", data: [header, ...rows], options: {} }])
}

export const getImportEmissionFactorsTemplateUrl = async () =>
  withServerResponse('getImportEmissionFactorsTemplateUrl', async () => {
    const key = process.env.SCW_EF_TEMPLATE_KEY
    if (!key) {
      throw new Error('templateNotFound')
    }
    const res = await getFileUrlFromBucket(key)
    if (!res.success) {
      throw new Error('templateNotFound')
    }
    return res.data
  })
