# Création et activation des comptes

La création de compte est mutualisée lorsque le modèle de données et les règles d'autorisation sont identiques. Les parcours d'inscription propres à chaque application restent distincts, car ils vérifient des critères d'éligibilité différents.

## Parcours d'inscription

- **BC+ :** `handleAddingUser` / `createUsersWithAccount` dans `apps/bc/src/db/user.ts`. Les comptes BC sont créés via les invitations dans une organisation ou les imports ; il n'existe pas de page publique dédiée à l'inscription.
- **TILT et CUT :** `signUpWithSiretOrCNC` dans `apps/bc/src/services/serverFunctions/user.ts`. TILT exige un SIRET d'association éligible ; CUT peut retrouver une organisation à partir d'un CNC ou d'un SIRET.
- **CLICKSON :** `signUpWithSchool` dans `apps/bc/src/services/serverFunctions/user.ts`. Une école est requise et, pour la France, son identifiant d'établissement doit être renseigné.
- **Course BC et Course TILT :** `checkCourseActivation` / `activateEmailForCourse` dans `apps/bc/src/services/serverFunctions/user.ts`. Un code de session correspondant à un apprenant ou à un professeur est requis.
- **MIP :** `signUpWithModelCampaign` dans `apps/mip/src/services/serverFunctions/user.ts`. Ce parcours crée une organisation MIP et l'associe à la campagne de modèles sélectionnée.

Les comptes BC sont propres à chaque environnement : l'activation et l'attribution des rôles doivent donc rester limitées à l'environnement concerné. À la première activation, un rôle est calculé pour le compte courant uniquement si son rôle est encore `DEFAULT` et qu'aucun membre actif ne se trouve dans l'organisation. Les rôles déjà définis par une invitation ou une validation sont préservés. La règle est partagée par BC+, TILT, CUT et CLICKSON dans `apps/bc/src/utils/user.ts` et appliquée dans `apps/bc/src/db/user.ts` ; l'onboarding affiche ce rôle sans le réécrire.

MIP utilise `AccountMip`, unique par utilisateur et par environnement (`packages/common/db/prisma/schema/mip/user_mip.prisma`) ; la définition du mot de passe ne doit mettre à jour que ce compte.

Le hachage du mot de passe et les statuts autorisés pour sa définition sont mutualisés dans `packages/common/utils/auth.ts`. Lorsqu'un mot de passe est défini, un compte validé devient actif ; un compte déjà actif le reste. Cette opération n'active pas les comptes importés, en attente de demande ou suspendus.

Les parcours d'inscription ne sont volontairement pas regroupés dans un flux générique : les contrôles liés à l'école, à l'entreprise ou au CNC, aux cours et à la campagne de modèles répondent à des règles distinctes. La mutualisation doit porter sur les règles communes de gestion des comptes sans contourner ces contrôles.
