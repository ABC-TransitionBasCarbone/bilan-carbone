import xlsx from 'node-xlsx'

export class OldBCWorkSheetsReader {
  organizationsWorksheet: OrganizationsWorkSheet
  emissionFactorsWorksheet: EmissionFactorsWorkSheet
  studiesWorksheet: StudiesWorkSheet
  studySitesWorksheet: StudySitesWorkSheet
  studyExportsWorksheet: StudyExportsWorkSheet
  emissionSourcesWorksheet: EmissionSourcesWorkSheet
  sitesETPsWorksheet: SitesETPsWorkSheet
  sitesCAsWorksheet: SitesCAsWorkSheet

  constructor(file: string) {
    const worksheets = xlsx.parse<(string | number)[]>(file)
    this.organizationsWorksheet = new OrganizationsWorkSheet(worksheets)
    this.emissionFactorsWorksheet = new EmissionFactorsWorkSheet(worksheets)
    this.studiesWorksheet = new StudiesWorkSheet(worksheets)
    this.studySitesWorksheet = new StudySitesWorkSheet(worksheets)
    this.studyExportsWorksheet = new StudyExportsWorkSheet(worksheets)
    this.emissionSourcesWorksheet = new EmissionSourcesWorkSheet(worksheets)
    this.sitesETPsWorksheet = new SitesETPsWorkSheet(worksheets)
    this.sitesCAsWorksheet = new SitesCAsWorkSheet(worksheets)
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
    Object.keys(requiredColumns).forEach((requiredHeader) => {
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
}

export enum RequiredOrganizationsColumns {
  ID_ENTITE = 'ID_ENTITE',
  NOM_ORGANISATION = 'NOM_ORGANISATION',
  NOM_ENTITE = 'NOM_ENTITE',
  SIRET = 'SIRET',
  ID_ENTITE_MERE = 'ID_ENTITE_MERE',
  IS_USER_ORGA = 'IS_USER_ORGA',
}

export type OrganizationRow = {
  [key in RequiredOrganizationsColumns]: string | number
}

export class OrganizationsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Organisations', RequiredOrganizationsColumns)
  }

  getRows(): OrganizationRow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      ID_ENTITE: row[this.indexes.ID_ENTITE],
      NOM_ORGANISATION: row[this.indexes.NOM_ORGANISATION],
      NOM_ENTITE: row[this.indexes.NOM_ENTITE],
      SIRET: row[this.indexes.SIRET],
      ID_ENTITE_MERE: row[this.indexes.ID_ENTITE_MERE],
      IS_USER_ORGA: row[this.indexes.IS_USER_ORGA],
    }))
  }
}

export enum RequiredEmissionFactorsColumns {
  EFV_GUID = 'EFV_GUID',
  ID_Source_Ref = 'ID_Source_Ref',
  GUID = 'GUID',
  EF_VAL_LIB = 'EF_VAL_LIB',
  EF_VAL_CARAC = 'EF_VAL_CARAC',
  EF_VAL_COMPLEMENT = 'EF_VAL_COMPLEMENT',
  Commentaires = 'Commentaires',
  DateValidité = 'DateValidité',
  Incertitude = 'Incertitude',
  Unité_Nom = 'Unité_Nom',
  EF_Statut = 'EF_Statut',
  EF_TYPE = 'EF_TYPE',
  Total_CO2e = 'Total_CO2e',
  CO2f = 'CO2f',
  CH4f = 'CH4f',
  CH4b = 'CH4b',
  N2O = 'N2O',
  HFC = 'HFC',
  PFC = 'PFC',
  SF6 = 'SF6',
  NF3 = 'NF3',
  CO2b = 'CO2b',
  Autre_gaz = 'Autre_gaz',
  Qualité_TeR = 'Qualité_TeR',
  Qualité_GR = 'Qualité_GR',
  Qualité_TiR = 'Qualité_TiR',
  Qualité_C = 'Qualité_C',
  Source_Nom = 'Source_Nom',
  NOM_CONTINENT = 'NOM_CONTINENT',
  NOM_PAYS = 'NOM_PAYS',
  NOM_REGION = 'NOM_REGION',
  NOM_DEPARTEMENT = 'NOM_DEPARTEMENT',
  FE_BCPlus = 'FE_BCPlus',
  Nom_DOMAINE = 'domain',
  NOM_CATEGORIES = 'category',
  NOM_SOUS_CATEGORIE = 'subCategory',
  NOM_POSTE = 'post',
  NOM_SOUS_POSTE = 'subPost',
}

export type EmissionFactorRow = {
  [key in RequiredEmissionFactorsColumns]: string | number
}

export class EmissionFactorsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, "Facteurs d'émissions", RequiredEmissionFactorsColumns)
  }

  getRows(): EmissionFactorRow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      EFV_GUID: row[this.indexes.EFV_GUID],
      ID_Source_Ref: row[this.indexes.ID_Source_Ref],
      GUID: row[this.indexes.GUID],
      EF_VAL_LIB: row[this.indexes.EF_VAL_LIB],
      EF_VAL_CARAC: row[this.indexes.EF_VAL_CARAC],
      EF_VAL_COMPLEMENT: row[this.indexes.EF_VAL_COMPLEMENT],
      Commentaires: row[this.indexes.Commentaires],
      DateValidité: row[this.indexes.DateValidité],
      Incertitude: row[this.indexes.Incertitude],
      Unité_Nom: row[this.indexes.Unité_Nom],
      EF_Statut: row[this.indexes.EF_Statut],
      EF_TYPE: row[this.indexes.EF_TYPE],
      Total_CO2e: row[this.indexes.Total_CO2e],
      CO2f: row[this.indexes.CO2f],
      CH4f: row[this.indexes.CH4f],
      CH4b: row[this.indexes.CH4b],
      N2O: row[this.indexes.N2O],
      HFC: row[this.indexes.HFC],
      PFC: row[this.indexes.PFC],
      SF6: row[this.indexes.SF6],
      NF3: row[this.indexes.NF3],
      CO2b: row[this.indexes.CO2b],
      Autre_gaz: row[this.indexes.Autre_gaz],
      Qualité_TeR: row[this.indexes.Qualité_TeR],
      Qualité_GR: row[this.indexes.Qualité_GR],
      Qualité_TiR: row[this.indexes.Qualité_TiR],
      Qualité_C: row[this.indexes.Qualité_C],
      Source_Nom: row[this.indexes.Source_Nom],
      NOM_CONTINENT: row[this.indexes.NOM_CONTINENT],
      NOM_PAYS: row[this.indexes.NOM_PAYS],
      NOM_REGION: row[this.indexes.NOM_REGION],
      NOM_DEPARTEMENT: row[this.indexes.NOM_DEPARTEMENT],
      domain: row[this.indexes.Nom_DOMAINE],
      category: row[this.indexes.NOM_CATEGORIES],
      subCategory: row[this.indexes.NOM_SOUS_CATEGORIE],
      post: row[this.indexes.NOM_POSTE],
      subPost: row[this.indexes.NOM_SOUS_POSTE],
      FE_BCPlus: row[this.indexes.FE_BCPlus],
    }))
  }
}

export enum RequiredStudiesColumns {
  IDETUDE = 'oldBCId',
  NOM_ETUDE = 'name',
  PERIODE_DEBUT = 'startDate',
  PERIODE_FIN = 'endDate',
  ID_ENTITE = 'siteId',
}

export type StudyRow = {
  [key in RequiredStudiesColumns]: string | number
}

export class StudiesWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes', RequiredStudiesColumns)
  }

  getRows(): StudyRow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      oldBCId: row[this.indexes.IDETUDE],
      name: row[this.indexes.NOM_ETUDE],
      startDate: row[this.indexes.PERIODE_DEBUT],
      endDate: row[this.indexes.PERIODE_FIN],
      siteId: row[this.indexes.ID_ENTITE],
    }))
  }
}

export enum RequiredStudySitesColumns {
  ID_ENTITE = 'siteOldBCId',
  IDETUDE = 'studyOldBCId',
}

export type StudySiteRow = {
  [key in RequiredStudySitesColumns]: string | number
}

export class StudySitesWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes - sites', RequiredStudySitesColumns)
  }

  getRows(): StudySiteRow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      siteOldBCId: row[this.indexes.ID_ENTITE],
      studyOldBCId: row[this.indexes.IDETUDE],
    }))
  }
}

export enum RequiredStudyExportsColumns {
  IDETUDE = 'studyOldBCId',
  LIB_REFERENTIEL = 'type',
  LIBELLE_MODE_CONTROLE = 'control',
}

export type StudyExportRow = {
  [key in RequiredStudyExportsColumns]: string | number
}

export class StudyExportsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Etudes - exports', RequiredStudyExportsColumns)
  }

  getRows(): StudyExportRow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      studyOldBCId: row[this.indexes.IDETUDE],
      type: row[this.indexes.LIB_REFERENTIEL],
      control: row[this.indexes.LIBELLE_MODE_CONTROLE],
    }))
  }
}

export enum RequiredStudyEmissionSourcesColumns {
  ID_ETUDE = 'studyOldBCId',
  ID_ENTITE = 'siteOldBCId',
  DESCRIPTIF_DATA = 'descriptifData',
  POURCENT_RECYCLE = 'recycledPart',
  INCERTITUDE_DA = 'incertitudeDA',
  Commentaires = 'commentaires',
  COMMENTAIRES_COLLECTE = 'commentairesCollecte',
  ValidationDASaisie = 'validationDASaisie',
  DA_VAL_TOTAL = 'daTotalValue',
  IDEF_TYPE = 'idefType',
  Nom_DOMAINE = 'domain',
  NOM_CATEGORIES = 'category',
  NOM_SOUS_CATEGORIE = 'subCategory',
  NOM_POSTE = 'post',
  NOM_SOUS_POSTE = 'subPost',
  ID_Source_Ref = 'emissionFactorImportedId',
  EFV_GUID = 'emissionFactorOldBCId',
  EF_VAL_Conso = 'emissionFactorConsoValue',
  Amortissement = 'amortissement',
  LIB_CARACT = 'caracterisation',
}

export type EmissionSourceRow = {
  [key in RequiredStudyEmissionSourcesColumns]: string | number
}

export class EmissionSourcesWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Données sources', RequiredStudyEmissionSourcesColumns)
  }

  getRows(): EmissionSourceRow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      studyOldBCId: row[this.indexes.ID_ETUDE],
      siteOldBCId: row[this.indexes.ID_ENTITE],
      descriptifData: row[this.indexes.DESCRIPTIF_DATA],
      recycledPart: row[this.indexes.POURCENT_RECYCLE],
      incertitudeDA: row[this.indexes.INCERTITUDE_DA],
      commentaires: row[this.indexes.Commentaires],
      commentairesCollecte: row[this.indexes.COMMENTAIRES_COLLECTE],
      validationDASaisie: row[this.indexes.ValidationDASaisie],
      daTotalValue: row[this.indexes.DA_VAL_TOTAL],
      idefType: row[this.indexes.IDEF_TYPE],
      domain: row[this.indexes.Nom_DOMAINE],
      category: row[this.indexes.NOM_CATEGORIES],
      subCategory: row[this.indexes.NOM_SOUS_CATEGORIE],
      post: row[this.indexes.NOM_POSTE],
      subPost: row[this.indexes.NOM_SOUS_POSTE],
      emissionFactorImportedId: row[this.indexes.ID_Source_Ref],
      emissionFactorOldBCId: row[this.indexes.EFV_GUID],
      emissionFactorConsoValue: row[this.indexes.EF_VAL_Conso],
      amortissement: row[this.indexes.Amortissement],
      caracterisation: row[this.indexes.LIB_CARACT],
    }))
  }
}

enum RequiredSitesCAColumns {
  ID_ENTITE = 'siteOldBCId',
  DATE_DEBUT = 'startDate',
  DATE_FIN = 'endDate',
  VALEUR_FIN = 'value',
  LIB_FIN_UNITE = 'unit',
}

export type SiteCARow = {
  [key in RequiredSitesCAColumns]: string | number
}

export class SitesCAsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Sites - CA', RequiredSitesCAColumns)
  }

  getRows(): SiteCARow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      siteOldBCId: row[this.indexes.ID_ENTITE],
      startDate: row[this.indexes.DATE_DEBUT],
      endDate: row[this.indexes.DATE_FIN],
      value: row[this.indexes.VALEUR_FIN],
      unit: row[this.indexes.LIB_FIN_UNITE],
    }))
  }
}

enum RequiredSitesETPColumns {
  ID_ENTITE = 'siteOldBCId',
  DATE_DEBUT = 'startDate',
  DATE_FIN = 'endDate',
  NB_EMPLOYES = 'numberOfEmployees',
}

export type SiteETPRow = {
  [key in RequiredSitesETPColumns]: string | number
}

export class SitesETPsWorkSheet extends OldBCWorkSheetReader {
  constructor(worksheets: { name: string; data: (string | number)[][] }[]) {
    super(worksheets, 'Sites - ETP', RequiredSitesETPColumns)
  }

  getRows(): SiteETPRow[] {
    return this.worksheet.data.slice(1).map((row) => ({
      siteOldBCId: row[this.indexes.ID_ENTITE],
      startDate: row[this.indexes.DATE_DEBUT],
      endDate: row[this.indexes.DATE_FIN],
      numberOfEmployees: row[this.indexes.NB_EMPLOYES],
    }))
  }
}
