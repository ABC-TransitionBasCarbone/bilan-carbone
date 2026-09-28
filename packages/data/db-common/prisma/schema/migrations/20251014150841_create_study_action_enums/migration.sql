-- CreateEnum
CREATE TYPE "ActionPotentialDeduction" AS ENUM ('Quality', 'Quantity', 'EmissionSources');

-- CreateEnum
CREATE TYPE "ActionNature" AS ENUM ('Physical', 'Reglementary', 'Organisational', 'Behavioural');

-- CreateEnum
CREATE TYPE "ActionCategory" AS ENUM ('Immediate', 'Strategic', 'Priority', 'Improvement', 'Adaptation');

-- CreateEnum
CREATE TYPE "ActionRelevance" AS ENUM ('Offsetting', 'Sequestration', 'Avoidance', 'AvoidanceFinancing', 'ReductionOutsideOrganisationValueChain', 'ReductionWithinOrganisationCoreBusiness');
