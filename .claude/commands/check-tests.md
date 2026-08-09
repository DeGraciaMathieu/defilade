---
description: Analyse la couverture des macro-tests, propose les tests manquants (avec validation), puis relance la suite.
---

# check-tests

Analyser la couverture de test du changement en cours et compléter les macro-tests
manquants.

## Périmètre

1. Lire `CLAUDE.md` et le skill `testing`.
2. Récupérer le diff : `git diff`, `git diff --cached`, `git status`,
   `git log --oneline -5`.
3. Si rien n'a changé, l'indiquer et s'arrêter.

## Analyse

- Pour chaque règle ajoutée ou modifiée dans `src/rules/`, vérifier qu'un macro-test couvre
  son cas nominal **et** le cas limite qui justifie la règle.
- Signaler les tests qui portent sur l'implémentation plutôt que sur le comportement.
- Statut **OK / MANQUANT / À REVOIR** par règle, avec le fichier de test attendu
  (`tests/<module>.test.js`).

## Proposition

Lister les macro-tests manquants sous forme d'énoncés de règle (vocabulaire de jeu), avec le
fichier cible. **Attendre la validation de l'utilisateur avant d'écrire quoi que ce soit.**

## Après validation

- Écrire les tests validés, en construisant l'état avec des littéraux explicites et un `rng`
  seedé/à séquence imposée pour les branches aléatoires.
- Relancer `npm test` et rapporter le résultat.

## Rapport

Tableau règle → statut → test proposé/ajouté, puis verdict : couverture suffisante / à
compléter.
