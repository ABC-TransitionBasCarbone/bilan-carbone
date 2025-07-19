-- Correction #1: Supprimer les réponses et sources des déplacements professionnels si FE courte distance
BEGIN;

CREATE TEMP TABLE temp_ids_to_delete AS
WITH problematic_answers AS (
    SELECT DISTINCT a.id as answer_id
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE q.id_intern = '10-decrivez-les-deplacements-professionnels-de-vos-collaborateurs'
      AND EXISTS (
          SELECT 1 
          FROM answer_emission_sources aes
          JOIN study_emission_sources ses ON ses.id = aes.emission_source_id
          JOIN emission_factors ef ON ef.id = ses.emission_factor_id
          WHERE aes.answer_id = a.id
            AND ef.imported_id IN ('43253', '43254', '28150', '28151', '27998', '27999', '28000', '28331', '134', '135', '28329')
      )
)
SELECT 
    pa.answer_id,
    aes.id as link_id,
    ses.id as source_id
FROM problematic_answers pa
JOIN answer_emission_sources aes ON aes.answer_id = pa.answer_id
JOIN study_emission_sources ses ON ses.id = aes.emission_source_id;

DELETE FROM answers 
WHERE id IN (SELECT DISTINCT answer_id FROM temp_ids_to_delete);

DELETE FROM study_emission_sources 
WHERE id IN (SELECT DISTINCT source_id FROM temp_ids_to_delete);

DROP TABLE temp_ids_to_delete;

COMMIT;


-- Correction #2: Changer le facteur d'émission pour le transport d'une tournée par le FE avec imported_id = 43256
BEGIN;

UPDATE study_emission_sources 
SET emission_factor_id = (
    SELECT id FROM emission_factors WHERE imported_id = '43256' LIMIT 1
)
WHERE id IN (
    SELECT DISTINCT ses.id
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    JOIN answer_emission_sources aes ON aes.answer_id = a.id
    JOIN study_emission_sources ses ON ses.id = aes.emission_source_id
    JOIN emission_factors ef ON ef.id = ses.emission_factor_id
    WHERE q.id_intern = 'combien-dequipes-de-films-avez-vous-recu-en'
      AND ef.imported_id != '43256'  -- Ne pas mettre à jour si déjà correct
      AND ses.name NOT LIKE '%-meal'  -- Exclure les sources de repas déjà correctes
);

COMMIT;


-- Correction #3a: Recalculer les valeurs des déchets générés en multipliant par 0.001
BEGIN;

UPDATE study_emission_sources 
SET value = value * 0.001
WHERE id IN (
    SELECT DISTINCT ses.id
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    JOIN answer_emission_sources aes ON aes.answer_id = a.id
    JOIN study_emission_sources ses ON ses.id = aes.emission_source_id
    WHERE q.id_intern = '10-veuillez-renseigner-les-dechets-generes-par-semaine'
      AND ses.value IS NOT NULL AND ses.value > 0
);

COMMIT;


-- Correction #3b: Recalculer les valeurs des lampes Xenon en multipliant par 0.86
BEGIN;

UPDATE study_emission_sources 
SET value = value * 0.86
WHERE id IN (
    SELECT DISTINCT ses.id
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    JOIN answer_emission_sources aes ON aes.answer_id = a.id
    JOIN study_emission_sources ses ON ses.id = aes.emission_source_id
    WHERE q.id_intern = 'quelle-quantite-de-lampes-xenon-jetez-vous-par-an'
      AND ses.value IS NOT NULL AND ses.value > 0
);

COMMIT;


-- Correction #4: Supprimer les sources d'émission des newsletters
BEGIN;

DELETE FROM study_emission_sources 
WHERE id IN (
    SELECT DISTINCT ses.id
    FROM study_emission_sources ses
    JOIN answer_emission_sources aes ON aes.emission_source_id = ses.id
    JOIN answers a ON a.id = aes.answer_id
    JOIN questions q ON a.question_id = q.id
    WHERE q.id_intern = 'combien-de-newsletters-ont-ete-envoyees'
);

COMMIT;


-- Correction #5: Diviser les valeurs par 1000 pour conversion EURO → KEURO
BEGIN;

UPDATE study_emission_sources 
SET value = value * 0.001
WHERE id IN (
    SELECT DISTINCT ses.id
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    JOIN answer_emission_sources aes ON aes.answer_id = a.id
    JOIN study_emission_sources ses ON ses.id = aes.emission_source_id
    WHERE q.unit = 'KEURO'
      AND ses.value IS NOT NULL AND ses.value > 0
);

COMMIT;


-- Correction #6: Supprimer toutes les réponses aux questions d'affichage précédemment erronnées (pas de sources d'émission créées)
BEGIN;

DELETE FROM answers 
WHERE id IN (
    SELECT DISTINCT a.id
    FROM answers a
    JOIN questions q ON a.question_id = q.id
    WHERE q.id_intern IN (
        'le-cinema-dispose-t-il-dun-affichage-exterieur-si-oui-quelle-surface',
        'combien-decrans-se-trouvent-dans-les-espaces-de-circulation',
        'combien-de-caissons-daffichage-dynamique-sont-presents-dans-le-cinema'
    )
);

COMMIT;
