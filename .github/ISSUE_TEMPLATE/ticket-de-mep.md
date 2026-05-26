---
name: Ticket de MEP
about: Modèle pour préparer une mise en production
title: '[MEP] '
labels: ''
assignees: ''
---

## Contexte

Processus de MEP (à mettre dans la PR develop > master) :warning: Faire attention à :

- [ ] Regarder les tickets en test, en déploiement et en retour
- [ ] Pas de MEP le jeudi (règle du process projet pour éviter une MEP juste avant fin de semaine)
- [ ] Pas de MEP solo
  - [ ] La documentation de MEP est complète et à jour
  - [ ] Est ce que toutes les issues sont OK ?
- [ ] Pas de multi tâches sur le projet
- [ ] Backup avant la MEP
- [ ] Task force en cas de force majeure
- [ ] En cas de script faire un select avant de faire delete ou update et conserver les données dans un excel quelques jours (à supprimer ensuite !)

:white_check_mark: Pré-requis si migration BDD complexe

- [ ] Déployer master sur staging
- [ ] npx prisma migrate reset (staging uniquement, commande destructive)
- [ ] Déployer develop sur staging
- [ ] npx prisma migrate deploy + prisma generate
- [ ] Tester que la migration est bien passée

:ballot_box_with_check: Actions de MEP si migration complexe

- [ ] Une PR develop sur master
- [ ] Déployer master sur la production

:test_tube: Tests possibles

Test de MEP sur staging

1. Faire tourner le CRON sur staging
2. Ajouter des CNC + FE CUT + FE base empreinte (une seule version) + les questions CUT
3. [Cas de test](https://docs.google.com/spreadsheets/d/1SpW5aEAvIVnssdd7UdpxbyIjMLldTBvxUbPL34BzPek/edit?pli=1&gid=0#gid=0)

## Tests d'acceptance

Les environnements impactés sont : (Vérifier que la fonctionnalité fonctionne sur ceux cochés, vérifier que la fonctionnalité n'a pas d'impact sur ceux décochés)

- [x] le BC+,
- [x] TILT,
- [x] CUT
- [x] CLICKSON

## Information pour le déploiement sur staging

## Stratégie technique

- [ ] Ajout de tests cypress
