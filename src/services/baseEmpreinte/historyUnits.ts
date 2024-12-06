import { Unit } from '@prisma/client'

export const unitsMatrix: Record<string, Unit> = {
  '100 feuilles A4': Unit.A4_SHEET_100,
  '100km': Unit.KM_100,
  actif: Unit.ACTIVE,
  appareil: Unit.APPAREL,
  'course.km': Unit.RACE_KM,
  'euro dépensé': Unit.EURO_SPENT,
  'Franc CFP': Unit.FRANC_CFP,
  'GJ PCI': Unit.GJ_PCI,
  'GJ PCS': Unit.GJ_PCS,
  ha: Unit.HA,
  'ha.an': Unit.HA_YEAR,
  'ha de clémentine': Unit.HA_CLEMENTINE,
  heure: Unit.HOUR,
  keuro: Unit.KEURO,
  kg: Unit.KG,
  'kg BioGNC': Unit.KG_BIOGNC,
  "kg d'azote épandu": Unit.KG_NITROGEN_SPREAD,
  'kg DCO éliminée': Unit.KG_DCO_REMOVED,
  'kg de biodéchets': Unit.KG_BIOWASTE,
  "kg de blé tendre à 15% d'humidité": Unit.KG_SOFT_WHEAT_15,
  'kg de cuir traité': Unit.KG_TREATED_LEATHER,
  "kg de féverole à 15% d'humidité": Unit.KG_FABA_BEAN_15,
  'kg de grains de café vert sans pulpe': Unit.KG_GREEN_COFFEE_BEANS_NO_PULP,
  "kg de grains de colza à 9% d'humidité": Unit.KG_RAPESEED_9,
  'kg de laine': Unit.KG_WOOL,
  'kg de lait': Unit.KG_MILK,
  "kg de maïs grain à 28% d'humidité": Unit.KG_CORN_28,
  'kg de matière active': Unit.KG_ACTIVE_MATERIAL,
  'kg de matière brute': Unit.KG_RAW_MATERIAL,
  'kg de matière brute (12% humidité)': Unit.KG_RAW_MATERIAL_12,
  'kg de matière brute (15% humidité)': Unit.KG_RAW_MATERIAL_15,
  'kg de matière brute (74% humidité)': Unit.KG_RAW_MATERIAL_74,
  'kg de matière brute (80% humidité)': Unit.KG_RAW_MATERIAL_80,
  'kg de matière brute (9% humidité)': Unit.KG_RAW_MATERIAL_9,
  'kg de matière brute (contenant 16% de sucre)': Unit.KG_RAW_MATERIAL_16_SUGAR,
  'kg de matière brute (sans pulpe)': Unit.KG_RAW_MATERIAL_NO_PULP,
  'kg de matière sèche': Unit.KG_DRY_MATTER,
  'kg de poids net': Unit.KG_NET_WEIGHT,
  'kg de poids vif': Unit.KG_LIVE_WEIGHT,
  'kg de poids vif (cat 0)': Unit.KG_LIVE_WEIGHT_CAT_0,
  'kg de poids vif (cat 1)': Unit.KG_LIVE_WEIGHT_CAT_1,
  'kg de poids vif (cat 2)': Unit.KG_LIVE_WEIGHT_CAT_2,
  'kg de poids vif (cat 3)': Unit.KG_LIVE_WEIGHT_CAT_3,
  "kg de pois de printemps à 15% d'humidité": Unit.KG_SPRING_PEAS_15,
  "kg de pomme de terre à 80% d'humidité": Unit.KG_POTATO_80,
  "kg de pomme de terre fécule à 74% d'humidité": Unit.KG_STARCH_POTATO_74,
  "kg de triticale à 15% d'humidité": Unit.KG_TRITICALE_15,
  'kg de viande net commercialisable': Unit.KG_NET_COMMERCIALLY_VIABLE_MEAT,
  "kg d'herbe pâturée à 80% d'humidité": Unit.KG_PASTURED_GRASS_80,
  "kg d'ingrédient en sortie de magasin (poids net)": Unit.KG_INGREDIENT_EXIT_STORE_NET_WEIGHT,
  "kg d'ingrédient en sortie de magasin (poids net gr)": Unit.KG_INGREDIENT_EXIT_STORE_NET_WEIGHT_GR,
  "kg d'ingrédient en sortie de magasin (poids net grains)": Unit.KG_INGREDIENT_EXIT_STORE_NET_WEIGHT_GRAINS,
  "kg d'ingrédient ingéré": Unit.KG_INGESTED_INGREDIENT,
  "kg d'oeuf": Unit.KG_EGG,
  "kg d'oeuf (cat 0)": Unit.KG_EGG_CAT_0,
  "kg d'oeuf (cat 1)": Unit.KG_EGG_CAT_1,
  "kg d'oeuf (cat 2)": Unit.KG_EGG_CAT_2,
  "kg d'oeuf (cat 3)": Unit.KG_EGG_CAT_3,
  "kg d'orge de brasserie à 15% d'humidité": Unit.KG_BREWING_BARLEY_15,
  "kg d'orge fourragère à 15% d'humidité": Unit.KG_FEED_BARLEY_15,
  kgH2: Unit.KGH2,
  'kg lait': Unit.KG_MILK_LIQUID,
  'kg NTK': Unit.KG_NTK,
  km: Unit.KM,
  'km.personne': Unit.KM_PERSON,
  kWh: Unit.KWH,
  'kWh PCI': Unit.KWH_PCI,
  'kWh PCS': Unit.KWH_PCS,
  litre: Unit.LITER,
  'litre de liquide': Unit.LITER_LIQUID,
  livre: Unit.POUND,
  m: Unit.METER,
  'm² SHON': Unit.M2_SHON,
  'm³': Unit.M3,
  'm³.km': Unit.M3_KM,
  'm³ (n)': Unit.M3_N,
  'm de route': Unit.METER_ROAD,
  'MJ PCI': Unit.MJ_PCI,
  mL: Unit.ML,
  'm²': Unit.M2,
  'm² de paroi': Unit.M2_WALL,
  'm² de sol': Unit.M2_FLOOR,
  'm² de toiture': Unit.M2_ROOF,
  'passager.km': Unit.PASSENGER_KM,
  'peq.km': Unit.PEQ_KM,
  'personne.mois': Unit.PERSON_MONTH,
  'pièce (arbuste en pot)': Unit.UNIT_PIECE_SHRUB_POT,
  'pièce (arbuste en pot de 3 litres)': Unit.UNIT_PIECE_SHRUB_POT_3L,
  'pièce (greffon)': Unit.UNIT_PIECE_GRAFT,
  'pièce (tige)': Unit.UNIT_PIECE_STEM,
  portion: Unit.PORTION,
  repas: Unit.MEAL,
  t: Unit.T,
  tep: Unit.TEP,
  'tep PCI': Unit.TEP_PCI,
  'tep PCS': Unit.TEP_PCS,
  't.km': Unit.TON_KM,
  tonne: Unit.TON,
  'tonne avec os': Unit.TON_WITH_BONES,
  'tonne brute': Unit.TON_RAW,
  'tonne collectée': Unit.TON_COLLECTED,
  'tonne de clinker': Unit.TON_CLINKER,
  'tonne de déchets': Unit.TON_WASTE,
  'tonne de K2O': Unit.TON_K2O,
  'tonne de matière sèche': Unit.TON_DRY_MATTER,
  'tonne de N': Unit.TON_N,
  'tonne de P2O5': Unit.TON_P2O5,
  'tonne de viande nette commercialisable': Unit.TON_VIABLE_MEAT,
  'tonne.km': Unit.TON_KM_PRODUCED,
  'tonne produites': Unit.TON_PRODUCTED,
  'tonne traitée': Unit.TON_PROCESSED,
  unité: Unit.UNIT,
  'Unité importée pièce (arbuste en pot)': Unit.IMPORTED_UNIT_PIECE_SHRUB_POT,
  'véhicule.an': Unit.VEHICLE_YEAR,
  'véhicule.km': Unit.VEHICLE_KM,
  'voiture.km': Unit.CAR_KM,
  '%': Unit.PERCENT,
  'GJ / tonne': Unit.GJ_PER_TON,
  '(tonne.km route) / (habitant.an)': Unit.TON_KM_ROAD_PER_PERSON_YEAR,
  'kg de fluide': Unit.KG_FLUID,
  'kWh / (ménage.an)': Unit.KWH_PER_HOME_YEAR,
  'km / (personne.an)': Unit.KM_PER_PERSON_YEAR,
  'kgN / ha': Unit.KGN_PER_HA,
  'kWh / (m².an)': Unit.KWH_PER_M2_YEAR,
  GWh: Unit.GWH,
  'kg de fluide / kW frigo': Unit.KG_FLUID_PER_KW_FRIDGE,
  'kg de fluide / m²': Unit.KG_FLUID_PER_m2,
  'Kg de fluide / équipement': Unit.KG_FLUID_PER_EQUIPMENT,
  'kg de fluide / m³ de stockage': Unit.KG_FLUID_PER_STORAGE_M3,
  'kWh / (logement.an)': Unit.KWH_PER_HOUSING_YEAR,
  '% des appartements': Unit.PERCENT_APPARTMENTS,
  '% des maisons': Unit.PERCENT_HOUSES,
  jours: Unit.DAY,
  'litre / ha': Unit.LITER_PER_HA,
  'MJ / ha': Unit.MJ_PER_HA,
  'kWh / (habitant.étage.an)': Unit.KWH_PER_PERSON_FLOOR_YEAR,
  plant: Unit.PLANT,
  'kg / m³': Unit.KG_PER_m3,
  kgDBO: Unit.KGDBO,
  'kgDBO / m³': Unit.KGDBO_PER_M3,
  'kgH2/100km': Unit.KG_H2_PER_100KM,
}
