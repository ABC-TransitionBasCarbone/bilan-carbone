UPDATE bilan_carbone.study_emission_sources
SET depreciation_period = 1
WHERE bilan_carbone.study_emission_sources.sub_post in (
  'DeplacementsFabricationDesVehicules',
  'TransportFabricationDesVehicules'
);