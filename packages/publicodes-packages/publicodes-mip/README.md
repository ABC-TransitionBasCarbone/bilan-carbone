# publicodes-tilt

Règles de calculs du modèle TILT, dédié à l'évaluation de l'empreinte carbone des salles de cinéma selon la méthodologie TILT.

## Présentation

Ce package contient les règles Publicodes pour le modèle TILT, qui structure l'évaluation autour de postes et sous-postes métiers adaptés au secteur cinématographique. Les règles sont écrites en Publicodes (`.publicodes`/`.yaml`) et organisées par poste dans le dossier `src`.

## Architecture des Postes et Sous-Postes

Le modèle TILT s'appuie sur une organisation par **postes** (ex : Énergie, Déchets, Achats, etc.) et **sous-postes** (ex : Batiment, Equipe, Achats, Fret, etc.), chacun étant mappé à une règle Publicodes spécifique.

La correspondance entre les sous-postes et les règles Publicodes est centralisée dans le fichier [`subPostMapping.ts`](../../src/environments/tilt/publicodes/subPostMapping.ts).  
Exemple de mapping :

```ts
const SUBPOST_TO_RULENAME: Partial<Record<SubPost, TiltRuleName>> = {
  Batiment: "fonctionnement . bâtiment",
  Equipe: "fonctionnement . équipe",
  DeplacementsProfessionnels: "fonctionnement . déplacements pro",
  Energie: "fonctionnement . énergie",
  // ...
};
```

Chaque sous-poste dispose également d'une configuration de formulaire (layout) associée, permettant de générer dynamiquement les questions à poser à l'utilisateur selon la structure attendue par Publicodes.

## Exemple de Layout de Formulaire

Le mapping des sous-postes vers les layouts de formulaire est défini dans `SUBPOST_TO_FORM_LAYOUTS` :

```ts
export const SUBPOST_TO_FORM_LAYOUTS: Partial<
  Record<SubPost, FormLayout<TiltRuleName>[]>
> = {
  Batiment: [
    input("fonctionnement . bâtiment . construction . surface"),
    input("fonctionnement . bâtiment . construction . année de construction"),
    group("BatimentRenovation.question", [
      "fonctionnement . bâtiment . rénovation . type . rénovation totale",
      "fonctionnement . bâtiment . rénovation . type . extension",
      // ...
    ]),
    // ...
  ],
  // ...
};
```

Chaque entrée décrit les champs à afficher pour le sous-poste concerné, en s'appuyant sur les règles Publicodes correspondantes.

## Développement

```sh
# Installer les dépendances
yarn install

# Compiler les règles Publicodes
yarn compile

# Lancer les tests unitaires
yarn test

# Démarrer le serveur de documentation
yarn dev
```

## Tests

Des situations de test sont définies dans le dossier `situations` pour valider les calculs et garantir la non-régression. Des tests unitaires sont également présents dans le dossier `tests`.

## Pour aller plus loin

- Voir [`subPostMapping.ts`](../../src/environments/tilt/publicodes/subPostMapping.ts) pour la logique de mapping complète.
- Les règles Publicodes sont éditables dans un éditeur compatible (ex : VSCode avec l’extension Publicodes).
- Pour toute modification de la structure des postes/sous-postes ou des layouts, adapter le mapping dans `subPostMapping.ts`.
