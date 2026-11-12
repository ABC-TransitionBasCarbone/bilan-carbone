DROP INDEX "bilan_carbone"."study_templates_environment_template_key";
CREATE UNIQUE INDEX "study_templates_environment_template_study_id_key"
ON "bilan_carbone"."study_templates"("environment", "template", "study_id");
