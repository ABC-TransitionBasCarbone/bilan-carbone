import { Import } from '@prisma/client'
import { getEmissionFactorsFromCSV as getEmissionFactors } from '../getEmissionFactorsFromCSV'
import { mapBaseEmpreinteEmissionFactors } from './import'

export const getEmissionFactorsFromCSV = async (name: string, file: string) =>
  getEmissionFactors(name, file, Import.BaseEmpreinte, mapBaseEmpreinteEmissionFactors)
