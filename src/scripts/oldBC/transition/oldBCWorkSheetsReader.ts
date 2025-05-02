import xlsx from 'node-xlsx'

import { RequiredEmissionFactorsColumns } from './emissionFactors'
import { RequiredOrganizationsColumns } from './organizations'

export class OldBCWorkSheetsReader {
  organizationsWorksheet: OrganizationsWorkSheet
  emissionFactorsWorksheet: EmissionFactorsWorkSheet
  studiesWorksheet: StudiesWorkSheet
  studySitesWorksheet: StudySitesWorkSheet
  studyExportsWorksheet: StudyExportsWorkSheet
  emissionSourcesWorksheet: EmissionSourcesWorkSheet
  sitesCAWorksheet: SitesCAWorkSheet
  sitesETPWorksheet: SitesETPWorkSheet

  constructor(file: string) {
    const worksheets = xlsx.parse<(string | number)[]>(file)
    this.organizationsWorksheet = new OrganizationsWorkSheet(worksheets)
    this.emissionFactorsWorksheet = new EmissionFactorsWorkSheet(worksheets)
    this.studiesWorksheet = new StudiesWorkSheet(worksheets)
    this.studySitesWorksheet = new StudySitesWorkSheet(worksheets)
    this.studyExportsWorksheet = new StudyExportsWorkSheet(worksheets)
    this.emissionSourcesWorksheet = new EmissionSourcesWorkSheet(worksheets)
    this.sitesCAWorksheet = new SitesCAWorkSheet(worksheets)
    this.sitesETPWorksheet = new SitesETPWorkSheet(worksheets)
  }
}

export abstract class OldBCWorkSheetReader {
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

export class OrganizationsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Organisations', RequiredOrganizationsColumns)
  }
}

export class EmissionFactorsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, "Facteurs d'émissions", RequiredEmissionFactorsColumns)
  }
}

export enum RequiredStudiesColumns {
  oldBCId = 'IDETUDE',
  name = 'NOM_ETUDE',
  startDate = 'PERIODE_DEBUT',
  endDate = 'PERIODE_FIN',
  siteId = 'ID_ENTITE',
}

export class StudiesWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes', RequiredStudiesColumns)
  }
}

export enum RequiredStudySitesColumns {
  siteOldBCId = 'ID_ENTITE',
  studyOldBCId = 'IDETUDE',
}

export class StudySitesWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes - sites', RequiredStudySitesColumns)
  }
}

export enum RequiredStudyExportsColumns {
  studyOldBCId = 'IDETUDE',
  type = 'LIB_REFERENTIEL',
  control = 'LIBELLE_MODE_CONTROLE',
}

export class StudyExportsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes - exports', RequiredStudyExportsColumns)
  }
}

export enum RequiredStudyEmissionSourcesColumns {
  studyOldBCId = 'ID_ETUDE',
  siteOldBCId = 'ID_ENTITE',
  descriptifData = 'DESCRIPTIF_DATA',
  recycledPart = 'POURCENT_RECYCLE',
  commentaires = 'Commentaires',
  commentairesCollecte = 'COMMENTAIRES_COLLECTE',
  validationDASaisie = 'ValidationDASaisie',
  daTotalValue = 'DA_VAL_TOTAL',
  domain = 'Nom_DOMAINE',
  category = 'NOM_CATEGORIES',
  subCategory = 'NOM_SOUS_CATEGORIE',
  post = 'NOM_POSTE',
  subPost = 'NOM_SOUS_POSTE',
  emissionFactorOldBCId = 'EFV_GUID',
}

export class EmissionSourcesWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Données sources', RequiredStudyEmissionSourcesColumns)
  }
}

enum RequiredSitesCAColumns {
  siteOldBCId = 'ID_ENTITE',
  startDate = 'DATE_DEBUT',
  endDate = 'DATE_FIN',
  value = 'VALEUR_FIN',
  unit = 'LIB_FIN_UNITE',
}

export class SitesCAWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Sites - CA', RequiredSitesCAColumns)
  }
}

enum RequiredSitesETPColumns {
  siteOldBCId = 'ID_ENTITE',
  startDate = 'DATE_DEBUT',
  endDate = 'DATE_FIN',
  numberOfEmployees = 'NB_EMPLOYES',
}

export class SitesETPWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Sites - ETP', RequiredSitesETPColumns)
  }
}
