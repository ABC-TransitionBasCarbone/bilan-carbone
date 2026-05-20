import { mapBaseEmpreinteEmissionFactors } from '@/services/importEmissionFactor/baseEmpreinte/import'
import { getEmissionFactorsFromCSV } from '@/services/importEmissionFactor/getEmissionFactorsFromCSV'
import { addSourceToStudies } from '@/services/importEmissionFactor/import'
import {
  ControlMode,
  DeactivatableFeature,
  EmissionFactorStatus,
  EmissionSourceCaracterisation,
  EmissionSourceType,
  Export,
  Import,
  Level,
  StudyRole,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'

import { PrismaClient } from '@abc-transitionbascarbone/db-common'
import type { Account } from '@abc-transitionbascarbone/db-common/types'

const studyId = '91bb3826-2be7-4d56-bb9b-363f4d9af62f'
const siteId = 'c3f2b8d4-7a0c-4b3f-8c5b-5b5e7b6f3e3b'
const studySiteId = 'ca3e68bd-dee6-400a-b3cb-b3e11725282e'

export const createRealStudy = async (prisma: PrismaClient, creator: Account) => {
  if (!creator.organizationVersionId) {
    return null
  }

  await getEmissionFactorsFromCSV(
    'test',
    './prisma/seed/Base_Carbone_Test.csv',
    Import.BaseEmpreinte,
    mapBaseEmpreinteEmissionFactors,
  )

  await prisma.emissionFactorImportVersion.createMany({
    data: [
      { name: 'Legifrance_Test.csv', source: Import.Legifrance },
      { name: 'Negaoctet_Test.csv', source: Import.NegaOctet },
      { name: 'AIB_Test.csv', source: Import.AIB },
    ],
  })

  const creatorOrganizationVersion = await prisma.organizationVersion.findFirst({
    where: {
      id: creator.organizationVersionId,
    },
  })
  if (!creatorOrganizationVersion) {
    return null
  }

  await prisma.site.create({
    data: {
      id: siteId,
      name: 'Bourges',
      organizationId: creatorOrganizationVersion.organizationId,
      etp: 35,
      ca: 1_000_000,
    },
  })

  const version = await prisma.emissionFactorImportVersion.findFirst({
    where: { name: 'test', source: Import.BaseEmpreinte },
  })
  if (!version) {
    return null
  }

  const emissionFactors = await prisma.emissionFactor.findMany({
    where: { versions: { some: { importVersionId: version.id } } },
  })

  const papier = await prisma.emissionFactor.create({
    data: {
      importedFrom: Import.Manual,
      organizationId: creatorOrganizationVersion.organizationId,
      status: EmissionFactorStatus.Valid,
      co2b: 345,
      co2f: 34,
      ch4f: 284,
      n2o: 2,
      totalCo2: 320,
      reliability: 5,
      technicalRepresentativeness: 5,
      geographicRepresentativeness: 5,
      temporalRepresentativeness: 5,
      completeness: 5,
      importedId: '1',
      unit: Unit.TON,
      isMonetary: false,
      subPosts: [SubPost.DechetsDEmballagesEtPlastiques],
      metaData: {
        create: { language: 'fr', title: 'Papier, moyenne' },
      },
    },
  })

  await prisma.study.create({
    data: {
      id: studyId,
      name: 'BC V8.10',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isPublic: true,
      level: Level.Initial,
      exports: { create: { types: [Export.Beges, Export.GHGP], control: ControlMode.Operational } },
      createdBy: { connect: { id: creator.id } },
      organizationVersion: { connect: { id: creator.organizationVersionId } },
      sites: {
        createMany: { data: [{ id: studySiteId, siteId, etp: 35, ca: 1_000_000 }] },
      },
    },
  })

  await Promise.all(
    Object.values(Import)
      .filter((source) => source !== Import.Manual)
      .map((source) => addSourceToStudies(source, prisma)),
  )

  await prisma.deactivatableFeatureStatus.upsert({
    where: { feature: DeactivatableFeature.TransitionPlan },
    create: {
      feature: DeactivatableFeature.TransitionPlan,
      active: true,
      deactivatedSources: [],
      deactivatedEnvironments: [],
    },
    update: {
      active: true,
    },
  })

  await prisma.studyTagFamily.create({
    data: {
      name: 'Tag Family A',
      studyId,
      tags: {
        createMany: {
          data: [
            { name: 'Tag 1', color: '#fea3a3' },
            { name: 'Tag 2', color: '#fdf87f' },
          ],
        },
      },
    },
  })

  await prisma.studyTagFamily.create({
    data: {
      name: 'Tag Family B',
      studyId,
      tags: {
        createMany: {
          data: [{ name: 'Tag 3', color: '#fdf87f' }],
        },
      },
    },
  })

  await prisma.userOnStudy.create({ data: { role: StudyRole.Validator, accountId: creator.id, studyId } })

  const baseEmissionSource = {
    studyId,
    studySiteId,
    type: EmissionSourceType.Physical,
    validated: true,
    reliability: 5,
    source: 'Seed data',
  }

  await prisma.studyEmissionSource.createMany({
    data: [
      {
        ...baseEmissionSource,
        name: 'Fioul domestique, France continentale, Base Carbone',
        subPost: SubPost.CombustiblesFossiles,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 1500,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '14087')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Plaquettes forestières sèches (25% humidité), France continentale, Base Carbone',
        subPost: SubPost.CombustiblesOrganiques,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 25000,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34943')?.id,
      },
      {
        ...baseEmissionSource,
        name: '2022 - mix moyen, France continentale, Base Carbone',
        subPost: SubPost.Electricite,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 166000,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '42513')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'photovoltaïque - fabrication Europe, France continentale, Base Carbone',
        subPost: SubPost.Electricite,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 32000,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34721')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'R22 (HCFC-22), Base Carbone',
        subPost: SubPost.EmissionsLieesALaProductionDeFroid,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 8.5,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '43119')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Action sociale, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 1.50824,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25029')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Activités des organisations associatives, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 2.4,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25032')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Assurance, services bancaires, conseil et honoraires, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 10.21678,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '24997')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Courrier, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 1.45,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '24998')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Enseignement, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 13.1,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25026')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Hébergement et restauration, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 19.18852,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25000')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Machines et équipements, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 10.53958,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25022')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Meubles et autres biens manufacturés, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 7.04136,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25017')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Produits chimiques, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 3.136,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25018')?.id,
      },
      {
        ...baseEmissionSource,
        name: "Réparation et installation de machines et d'équipements, France continentale, Base Carbone",
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 3.36466,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25004')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Services (imprimerie, publicité, architecture et ingénierie, maintenance multi-technique des bâtimen, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 294.04176,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25001')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Télécommunications, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 142.65466,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '24999')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Transport terrestre, France continentale, Base Carbone',
        subPost: SubPost.ServicesEnApprocheMonetaire,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 3.3395,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '25005')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Acier ou fer blanc, France continentale, Base Carbone',
        subPost: SubPost.MetauxPlastiquesEtVerre,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 0.18,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '26729')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Acier ou fer blanc, France continentale, Base Carbone - Fin de vie',
        subPost: SubPost.TraitementDesEmballagesEnFinDeVie,
        caracterisation: EmissionSourceCaracterisation.FinalClient,
        value: 0.18,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34462')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Films plastiques PET (pas recyclable), France continentale, Base Carbone',
        subPost: SubPost.MetauxPlastiquesEtVerre,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 2.5,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '20835')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Films plastiques PET (pas recyclable), France continentale, Base Carbone - Fin de vie',
        subPost: SubPost.TraitementDesEmballagesEnFinDeVie,
        caracterisation: EmissionSourceCaracterisation.FinalClient,
        value: 2.5,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34496')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Bois courte durée de vie (ameublement…) fabrication, France continentale, Base Carbone',
        subPost: SubPost.AutresIntrants,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 2.6,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '20908')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Bois courte durée de vie (ameublement…) fabrication, France continentale, Base Carbone - Fin de vie',
        subPost: SubPost.TraitementDesEmballagesEnFinDeVie,
        caracterisation: EmissionSourceCaracterisation.FinalClient,
        value: 2.6,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34678')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Papier Moyen, Hors utilisation et fin de vie, France continentale, Base Carbone',
        subPost: SubPost.PapiersCartons,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 2500,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '24309')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Papier Moyen, Hors utilisation et fin de vie, France continentale, Base Carbone - Fin de vie',
        subPost: SubPost.TraitementDesEmballagesEnFinDeVie,
        caracterisation: EmissionSourceCaracterisation.FinalClient,
        value: 2.5,
        emissionFactorId: papier.id,
      },
      {
        ...baseEmissionSource,
        name: 'Carton - Fin de vie moyenne filière - impacts, France continentale, Base Carbone',
        subPost: SubPost.DechetsBatiments,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 1.3,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34486')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Papier/fin de vie moyenne, France continentale, Base Carbone',
        subPost: SubPost.DechetsBatiments,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 0.2,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '22024')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Plastique souple PET pétrosourcé - Fin de vie moyenne filière - Impacts, France continentale, Base Carbone',
        subPost: SubPost.DechetsDEmballagesEtPlastiques,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 0.5,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34512')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Déchets non dangereux en mélange (DIB) - Fin de vie moyenne - Impacts, France continentale, Base Carbone',
        subPost: SubPost.DechetsBatiments,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 1.1,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '34682')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Articulé, 34 à 40 T, diesel routier, 7% de biodiesel, France continentale, Base Carbone',
        subPost: SubPost.FretEntrant,
        caracterisation: EmissionSourceCaracterisation.NotOperatedSupported,
        value: 3668,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28041')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Articulé, 34 à 40 T, diesel routier, 7% de biodiesel, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 34400,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28041')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Rigide, 12 à 20 T, diesel routier, 7% biodiesel, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 33,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28033')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Porte-conteneurs, Dry, Europe - Afrique, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.NotOperatedSupported,
        value: 10387,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28205')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Porte-conteneurs, Dry, Europe - Amérique du Sud et Centrale, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.NotOperatedSupported,
        value: 38191,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28207')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Porte-conteneurs, Dry, Europe du Nord - Amérique du Nord, façade atlantique, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.NotOperatedSupported,
        value: 0,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28218')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Porte-conteneurs, Dry, Europe - Océanie, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.NotOperatedSupported,
        value: 41424,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28211')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Porte-conteneurs, Dry, Intra Méditerranée, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.NotOperatedSupported,
        value: 3000,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28225')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Porte-conteneurs, Dry, Asie - Europe du Nord, France continentale, Base Carbone',
        subPost: SubPost.FretSortant,
        caracterisation: EmissionSourceCaracterisation.NotOperatedSupported,
        value: 35685,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28203')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Voiture - motorisation essence - 2018, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsDomicileTravail,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 90339.2,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27965')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Voiture - motorisation gazole - 2018, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsDomicileTravail,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 106362.2,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27966')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Voiture particulière - cœur de gamme - véhicule compact - électrique, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsDomicileTravail,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 5494.6,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28007')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Autobus moyen - agglomération de 100 000 à 250 000 habitants, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsDomicileTravail,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 8240.4,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27999')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Métro, tramway, trolleybus - 2018 - Agglomération de 100 000 à 250 000 habitants, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsDomicileTravail,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 2289,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28150')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'TER - 2021 - traction moyenne, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsDomicileTravail,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 34335,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '37141')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Voiture - motorisation essence - 2018, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsProfessionnels,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 16500,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27965')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Voiture - motorisation gazole - 2018, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsProfessionnels,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 220000,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27966')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Voiture particulière - cœur de gamme - véhicule compact - électrique, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsProfessionnels,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 1700,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28007')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Intercités - 2019, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsProfessionnels,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 235000,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28144')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Avion passagers, court courrier, avec trainées, France continentale, Base Carbone',
        subPost: SubPost.DeplacementsProfessionnels,
        caracterisation: EmissionSourceCaracterisation.NotOperated,
        value: 4500,
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '28130')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Bâtiment industriel, structure métallique, France continentale, Base Carbone',
        subPost: SubPost.Batiments,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 750,
        depreciationPeriod: 30,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '20731')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Parking, classique - bitume, France continentale, Base Carbone',
        subPost: SubPost.AutresInfrastructures,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 500,
        depreciationPeriod: 30,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '26011')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Machines, France continentale, Base Carbone',
        subPost: SubPost.Equipements,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 1500,
        depreciationPeriod: 10,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '20906')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Mobilier, France continentale, Base Carbone',
        subPost: SubPost.Equipements,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 2,
        depreciationPeriod: 10,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '20907')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Ordinateur portable, France continentale, Base Carbone',
        subPost: SubPost.Informatique,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 15,
        depreciationPeriod: 3,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27002')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Ordinateur fixe - bureautique, France continentale, Base Carbone',
        subPost: SubPost.Informatique,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 10,
        depreciationPeriod: 3,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27003')?.id,
      },
      {
        ...baseEmissionSource,
        name: "Imprimante jet d'encre, France continentale, Base Carbone",
        subPost: SubPost.Informatique,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 5,
        depreciationPeriod: 5,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '27025')?.id,
      },
      {
        ...baseEmissionSource,
        name: 'Photocopieurs, Monde, Base Carbone',
        subPost: SubPost.Informatique,
        caracterisation: EmissionSourceCaracterisation.Operated,
        value: 2,
        depreciationPeriod: 7,
        constructionYear: new Date('01/06/2024'),
        emissionFactorId: emissionFactors.find((emissionFactor) => emissionFactor.importedId === '20591')?.id,
      },
    ],
  })
}
