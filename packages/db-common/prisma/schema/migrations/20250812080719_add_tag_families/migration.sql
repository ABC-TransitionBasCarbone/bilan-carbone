-- CreateTable
CREATE TABLE "public"."emission_source_tag_families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_source_tag_families_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emission_source_tag_families_name_study_id_key" ON "public"."emission_source_tag_families"("name", "study_id");

-- AddForeignKey
ALTER TABLE "public"."emission_source_tag_families" ADD CONSTRAINT "emission_source_tag_families_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- add default families
INSERT INTO emission_source_tag_families (id, name, study_id)
SELECT gen_random_uuid(), 'défaut', s.id
FROM studies s
WHERE NOT EXISTS (
    SELECT 1
    FROM emission_source_tag_families f
    WHERE f.study_id = s.id
      AND f.name = 'défaut'
);

-- 2. Créer la famille "personnalisés" pour chaque étude
-- uniquement si elle n'existe pas ET qu'il y a au moins un tag "non standard"
INSERT INTO emission_source_tag_families (id, name, study_id)
SELECT gen_random_uuid(), 'personnalisés', s.id
FROM studies s
WHERE NOT EXISTS (
    SELECT 1
    FROM emission_source_tag_families f
    WHERE f.study_id = s.id
      AND f.name = 'personnalisés'
)
AND EXISTS (
    SELECT 1
    FROM emission_source_tag t
    WHERE t.study_id = s.id
      AND t.name NOT IN (
        'Périmètre Interne',
        'Périmètre Bénévoles',
        'Périmètre Bénéficiaires',
        'Numérique'
      )
);
