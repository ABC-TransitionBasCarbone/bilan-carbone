import { SectenInfo } from '@abc-transitionbascarbone/db-common'

interface CreateSectenInfoParams {
  year: number
  total: number
  energy?: number
  industry?: number
  waste?: number
  buildings?: number
  agriculture?: number
  transportation?: number
}

export const createSectenInfo = (params: CreateSectenInfoParams): SectenInfo => {
  const {
    year,
    total,
    energy = 0,
    industry = 0,
    waste = 0,
    buildings = 0,
    agriculture = 0,
    transportation = 0,
  } = params
  return {
    id: `secten-${year}`,
    year,
    total,
    energy,
    industry,
    waste,
    buildings,
    agriculture,
    transportation,
    versionId: 'version-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export const createGeneralSectenData = (): SectenInfo[] => [
  createSectenInfo({ year: 1990, total: 547000 }),
  createSectenInfo({ year: 1991, total: 572000 }),
  createSectenInfo({ year: 1992, total: 561000 }),
  createSectenInfo({ year: 1993, total: 540000 }),
  createSectenInfo({ year: 1994, total: 531000 }),
  createSectenInfo({ year: 1995, total: 537000 }),
  createSectenInfo({ year: 1996, total: 555000 }),
  createSectenInfo({ year: 1997, total: 547000 }),
  createSectenInfo({ year: 1998, total: 561000 }),
  createSectenInfo({ year: 1999, total: 556000 }),
  createSectenInfo({ year: 2000, total: 551000 }),
  createSectenInfo({ year: 2001, total: 556000 }),
  createSectenInfo({ year: 2002, total: 550000 }),
  createSectenInfo({ year: 2003, total: 554000 }),
  createSectenInfo({ year: 2004, total: 554000 }),
  createSectenInfo({ year: 2005, total: 555000 }),
  createSectenInfo({ year: 2006, total: 545000 }),
  createSectenInfo({ year: 2007, total: 535000 }),
  createSectenInfo({ year: 2008, total: 530000 }),
  createSectenInfo({ year: 2009, total: 509000 }),
  createSectenInfo({ year: 2010, total: 513000 }),
  createSectenInfo({ year: 2011, total: 488000 }),
  createSectenInfo({ year: 2012, total: 491000 }),
  createSectenInfo({ year: 2013, total: 490000 }),
  createSectenInfo({ year: 2014, total: 457000 }),
  createSectenInfo({ year: 2015, total: 460000 }),
  createSectenInfo({ year: 2016, total: 463000 }),
  createSectenInfo({ year: 2017, total: 465000 }),
  createSectenInfo({ year: 2018, total: 446000 }),
  createSectenInfo({ year: 2019, total: 436000 }),
  createSectenInfo({ year: 2020, total: 396000 }),
  createSectenInfo({ year: 2021, total: 420000 }),
  createSectenInfo({ year: 2022, total: 403000 }),
  createSectenInfo({ year: 2023, total: 376000 }),
  createSectenInfo({ year: 2024, total: 369000 }),
]

export const createSectenDataWithSectors = (): SectenInfo[] => [
  createSectenInfo({
    year: 1990,
    total: 547000,
    energy: 100000,
    industry: 150000,
    transportation: 200000,
    buildings: 97000,
  }),
  createSectenInfo({
    year: 2000,
    total: 551000,
    energy: 95000,
    industry: 145000,
    transportation: 195000,
    buildings: 116000,
  }),
  createSectenInfo({
    year: 2010,
    total: 513000,
    energy: 67000,
    industry: 96000,
    transportation: 138000,
    buildings: 105000,
  }),
  createSectenInfo({
    year: 2015,
    total: 460000,
    energy: 80000,
    industry: 135000,
    transportation: 180000,
    buildings: 65000,
  }),
  createSectenInfo({
    year: 2020,
    total: 396000,
    energy: 70000,
    industry: 130000,
    transportation: 160000,
    buildings: 36000,
  }),
  createSectenInfo({
    year: 2024,
    total: 369000,
    energy: 65000,
    industry: 125000,
    transportation: 150000,
    buildings: 29000,
  }),
]
