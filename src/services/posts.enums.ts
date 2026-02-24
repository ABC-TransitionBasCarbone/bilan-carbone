// Enums definitions for Posts
// This file contains ONLY enum definitions to avoid circular dependencies
// All logic and mappings are in posts.ts

export enum BCPost {
  Energies = 'Energies',
  AutresEmissionsNonEnergetiques = 'AutresEmissionsNonEnergetiques',
  IntrantsBiensEtMatieres = 'IntrantsBiensEtMatieres',
  IntrantsServices = 'IntrantsServices',
  DechetsDirects = 'DechetsDirects',
  Fret = 'Fret',
  Deplacements = 'Deplacements',
  Immobilisations = 'Immobilisations',
  UtilisationEtDependance = 'UtilisationEtDependance',
  FinDeVie = 'FinDeVie',
}

export enum CutPost {
  Fonctionnement = 'Fonctionnement',
  MobiliteSpectateurs = 'MobiliteSpectateurs',
  TourneesAvantPremieres = 'TourneesAvantPremieres',
  SallesEtCabines = 'SallesEtCabines',
  ConfiseriesEtBoissons = 'ConfiseriesEtBoissons',
  Dechets = 'Dechets',
  BilletterieEtCommunication = 'BilletterieEtCommunication',
}

export enum TiltPost {
  ConstructionDesLocaux = 'ConstructionDesLocaux',
  Energies = BCPost.Energies,
  DechetsDirects = BCPost.DechetsDirects,
  FroidEtClim = 'FroidEtClim',
  AutresEmissions = 'AutresEmissions',
  DeplacementsDePersonne = 'DeplacementsDePersonne',
  TransportDeMarchandises = 'TransportDeMarchandises',
  IntrantsBiensEtMatieresTilt = 'IntrantsBiensEtMatieresTilt',
  Alimentation = 'Alimentation',
  IntrantsServices = BCPost.IntrantsServices,
  EquipementsEtImmobilisations = 'EquipementsEtImmobilisations',
  Utilisation = 'Utilisation',
  FinDeVie = BCPost.FinDeVie,
  Teletravail = 'Teletravail',
}

export enum ClicksonPost {
  EnergiesClickson = 'EnergiesClickson',
  Restauration = 'Restauration',
  DeplacementsClickson = 'DeplacementsClickson',
  Achats = 'Achats',
  ImmobilisationsClickson = 'ImmobilisationsClickson',
}
