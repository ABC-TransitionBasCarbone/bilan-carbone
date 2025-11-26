import { getJsDateFromExcel } from 'excel-date-to-js'
import { SitesCAsWorkSheet, SitesETPsWorkSheet } from './oldBCWorkSheetsReader'

export interface Period {
  startDate: Date
  endDate: Date
}

export interface DatedSiteAdditionalData<T> {
  siteOldBCId: string
  period: Period
  additionalData: T
}

export abstract class SitesAdditionalDataMapper<SAW, AD> {
  sitesDatedAdditionalDataMap: Map<string, DatedSiteAdditionalData<AD>[]>

  protected constructor(sitesAdditionalWorksheet: SAW) {
    this.sitesDatedAdditionalDataMap = new Map()
    this.getRows(sitesAdditionalWorksheet).forEach((datedAdditionalDatum: DatedSiteAdditionalData<AD>) => {
      const siteAdditionalData = this.sitesDatedAdditionalDataMap.get(datedAdditionalDatum.siteOldBCId)
      if (siteAdditionalData) {
        siteAdditionalData.push(datedAdditionalDatum)
      } else {
        this.sitesDatedAdditionalDataMap.set(datedAdditionalDatum.siteOldBCId, [datedAdditionalDatum])
      }
    })
  }

  abstract getRows(sitesAdditionalWorksheet: SAW): DatedSiteAdditionalData<AD>[]

  getMatchingSiteAdditionalData(siteOldBCId: string, startDate: Date, endDate: Date): AD | null {
    const siteAdditionalData = this.sitesDatedAdditionalDataMap.get(siteOldBCId)
    if (!siteAdditionalData) {
      return null
    }
    const foundSiteAdditionalDatum = siteAdditionalData.find(
      (siteETP) =>
        siteETP.period.startDate.getTime() === startDate.getTime() &&
        siteETP.period.endDate.getTime() === endDate.getTime(),
    )
    if (foundSiteAdditionalDatum) {
      return foundSiteAdditionalDatum.additionalData
    } else {
      return null
    }
  }
}

interface SiteETP {
  numberOfEmployees: number
}

export class SitesETPsMapper extends SitesAdditionalDataMapper<SitesETPsWorkSheet, SiteETP> {
  constructor(sitesETPWorkSheet: SitesETPsWorkSheet) {
    super(sitesETPWorkSheet)
  }

  getRows(sitesETPsWorkSheet: SitesETPsWorkSheet): DatedSiteAdditionalData<SiteETP>[] {
    return sitesETPsWorkSheet
      .getRows()
      .map((row) => {
        const startDate = row.startDate ? new Date(getJsDateFromExcel(row.startDate as number)) : null
        const endDate = row.endDate ? new Date(getJsDateFromExcel(row.endDate as number)) : null
        if (!startDate || !endDate) {
          return null
        }
        return {
          siteOldBCId: row.siteOldBCId as string,
          period: {
            startDate,
            endDate,
          },
          additionalData: { numberOfEmployees: row.numberOfEmployees as number },
        }
      })
      .filter((row) => row !== null)
  }
}

interface SiteCA {
  ca: number
}

export class SitesCAsMapper extends SitesAdditionalDataMapper<SitesCAsWorkSheet, SiteCA> {
  constructor(sitesCAWorkSheet: SitesCAsWorkSheet) {
    super(sitesCAWorkSheet)
  }

  getRows(sitesCAsWorksheet: SitesCAsWorkSheet): DatedSiteAdditionalData<SiteCA>[] {
    return sitesCAsWorksheet
      .getRows()
      .map((row) => {
        const startDate = row.startDate ? new Date(getJsDateFromExcel(row.startDate as number)) : null
        const endDate = row.endDate ? new Date(getJsDateFromExcel(row.endDate as number)) : null
        if (!startDate || !endDate) {
          return null
        }
        let multiply = 0
        if ((row.unit as string) === 'Unités') {
          multiply = 1
        } else if ((row.unit as string) === 'Milliers') {
          multiply = 1000
        } else if ((row.unit as string) === 'Millions') {
          multiply = 1000000
        }
        return {
          siteOldBCId: row.siteOldBCId as string,
          period: {
            startDate,
            endDate,
          },
          additionalData: { ca: (row.value as number) * multiply },
        }
      })
      .filter((row) => row !== null)
  }
}
