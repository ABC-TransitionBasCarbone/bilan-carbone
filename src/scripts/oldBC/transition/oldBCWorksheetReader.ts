import xlsx from 'node-xlsx'

import { RequiredEmissionFactorsColumns } from './emissionFactors'
import { RequiredOrganizationsColumns } from './organizations'
import {
  RequiredStudiesColumns,
  RequiredStudyEmissionSourcesColumns,
  RequiredStudyExportsColumns,
  RequiredStudySitesColumns,
} from './studies'

export class OldBCWorkSheetReader {
  organizationsWorksheet: OrganizationsWorkSheet
  emissionFactorsWorksheet: EmissionFactorsWorkSheet
  studiesWorksheet: StudiesWorkSheet
  studySitesWorksheet: StudySitesWorkSheet
  studyExportsWorksheet: StudyExportsWorkSheet
  studyEmissionSourcesWorksheet: EmissionSourcesWorkSheet

  constructor(file: string) {
    const worksheets = xlsx.parse<(string | number)[]>(file)
    this.organizationsWorksheet = new OrganizationsWorkSheet(worksheets)
    this.emissionFactorsWorksheet = new EmissionFactorsWorkSheet(worksheets)
    this.studiesWorksheet = new StudiesWorkSheet(worksheets)
    this.studySitesWorksheet = new StudySitesWorkSheet(worksheets)
    this.studyExportsWorksheet = new StudyExportsWorkSheet(worksheets)
    this.studyEmissionSourcesWorksheet = new EmissionSourcesWorkSheet(worksheets)
  }
}

export abstract class OldBCWorksheetReader {
  worksheet: { name: string; data: (string | number)[][] }
  indexes: Record<string, number>

  protected constructor(
    worksheets: { name: string; data: (string | number)[][] }[],
    name: string,
    requiredColumns: Record<string, string>,
  ) {
    const worksheet = worksheets.find((worksheet) => worksheet.name === name)
    if (!worksheet) {
      throw new Error(`Veuillez vérifier que le fichier contient une feuille "${name}" !`)
    }
    const headers = worksheet.data[0]
    const missingHeaders: string[] = []
    const indexes = {} as Record<string, number>
    Object.values(requiredColumns).forEach((requiredHeader) => {
      const index = headers.indexOf(requiredHeader)
      if (index === -1) {
        missingHeaders.push(requiredHeader)
      } else {
        indexes[requiredHeader] = index
      }
    })

    if (missingHeaders.length > 0) {
      throw new Error(`Colonnes manquantes dans la feuille '${name}' : ${missingHeaders.join(', ')}`)
    }

    this.worksheet = worksheet
    this.indexes = indexes
  }

  getRows() {
    return this.worksheet.data.slice(1)
  }

  getIndexes(): Record<string, number> {
    return this.indexes
  }
}

export class OrganizationsWorkSheet extends OldBCWorksheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Organisations', RequiredOrganizationsColumns)
  }
}

export class EmissionFactorsWorkSheet extends OldBCWorksheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, "Facteurs d'émissions", RequiredEmissionFactorsColumns)
  }
}

export class StudiesWorkSheet extends OldBCWorksheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes', RequiredStudiesColumns)
  }
}

export class StudySitesWorkSheet extends OldBCWorksheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes - sites', RequiredStudySitesColumns)
  }
}

export class StudyExportsWorkSheet extends OldBCWorksheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes - exports', RequiredStudyExportsColumns)
  }
}

export class EmissionSourcesWorkSheet extends OldBCWorksheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Données sources', RequiredStudyEmissionSourcesColumns)
  }
}
