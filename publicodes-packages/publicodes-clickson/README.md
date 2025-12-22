# publicodes-clickson

TODO

## Publicodes

Publicodes est un langage de programmation conçu pour modéliser des règles métier complexes de manière simple et lisible et créer des formulaires interactifs basés sur ces calculs. L'objectif est de permettre aux expert·e·s métier de contribuer au développement du simulateur sans compétence technique approfondie.

Les règles Publicodes sont écrites dans des fichiers au format `.yaml` (extenstion `.publicodes`) et éditables dans un éditeur de code comme VSCcode. L'extension Publicodes pour VSCcode offre des fonctionnalités telles que la coloration syntaxique, l'autocomplétion, la vérification des unités et la validation en temps réel, facilitant ainsi la rédaction et la maintenance des règles.

## Le modèle Clickson

TODO

## Tests

Des situations correspondantes à des jeux de réponses possibles pour des cinémas sont définies dans le dossier `situations`. Elle -s permettent de vérifier les calculs lors du développement ou bien faire l'objet de tests de non-régression.

Des tests unitaires sont également définis dans le dossier `tests` pour vérifier le bon comportement des règles.

## Development

```sh
// Install the dependencies (immutable by default)
yarn install

// Compile the Publicodes rules
yarn compile

// Run the tests
yarn test

// Run the documentation server
yarn dev
```
