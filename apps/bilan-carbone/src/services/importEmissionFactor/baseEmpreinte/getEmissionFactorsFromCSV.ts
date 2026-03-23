import { Import } from '@repo/db-common/enums'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { mapBaseEmpreinteEmissionFactors } from './import'

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, Import.BaseEmpreinte, mapBaseEmpreinteEmissionFactors)
