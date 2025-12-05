# publicodes-cut

Règles de calculs de count!, le premier calculateur d'impact écologique dédié aux salles de cinéma.

## Publicodes

Publicodes est un langage de programmation conçu pour modéliser des règles métier complexes de manière simple et lisible et créer des formulaires interactifs basés sur ces calculs. L'objectif est de permettre aux expert·e·s métier de contribuer au développement du simulateur sans compétence technique approfondie.

Les règles Publicodes sont écrites dans des fichiers au format `.yaml` (extenstion `.publicodes`) et éditables dans un éditeur de code comme VSCcode. L'extension Publicodes pour VSCcode offre des fonctionnalités telles que la coloration syntaxique, l'autocomplétion, la vérification des unités et la validation en temps réel, facilitant ainsi la rédaction et la maintenance des règles.

## Le modèle CUT

Le modèle CUT permet d'estimer l'empreinte carbone de salles de cinéma. Il s'appuie sur les postes de la méthode Bilan Carbone® :

- Fonctionnement
- Mobilité spectateurs
- Tournées avant-premières
- Salles et cabines
- Confiseries et boissons
- Déchets
- Billetterie et communication

Les règles sont écrites au sein du dossier `src`. Chaque dossier correspond à un poste du modèle CUT et chaque poste correspond à un fichier dont la règle parente est une somme de sous-postes. Par exemple, `déchets.publicodes` contient la règle `déchets`, qui est la somme des sous-postes `déchets . ordinaires` et `déchets . exceptionnels`.

Sont ensuite définies, au sein de chaque sous-poste, les règles de calculs via les mécanismes `formule` et `valeur` (utilisé pour les constantes mmême si dans le moteur, il n'y a aucune différence de traitement) et les questions à poser à l'utilisateur·rice. L'utilisation du mécanisme `avec` permet d'alléger la rédaction des règles en évitant de réécrire l'ensemble des espace-noms pour chaque règle.

Un fichier `commun.publicodes` contient des règles et constantes partagées par plusieurs postes du modèle.

Enfin, le fichier `général.publicodes` contient les règles correspondantes aux questions générales relatives à la salle de cinéma.

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
yarn doc
```
