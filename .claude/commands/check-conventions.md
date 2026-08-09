---
description: Vérification légère du diff — conventions, cohérence tests/doc, exécution des tests.
---

# check-conventions

Contrôle rapide des conventions sur le changement en cours, plus léger que `review`.

## Périmètre

1. Lire `CLAUDE.md`.
2. Récupérer le diff : `git diff`, `git diff --cached`, `git status`,
   `git log --oneline -5`.
3. Si rien n'a changé, l'indiquer et s'arrêter.

## Vérifications

Statut **OK / VIOLATION / N/A** par point, avec fichier:ligne.

- Pureté de `src/rules/` : aucun DOM, aucun `Math.random`/`Date.now`/`performance.now`,
  aucun import de `render/`/`input/`/`loop/`/`state/`.
- Aucune valeur magique de réglage hors `src/config.js` (hors cosmétiques documentées).
- Imports descendants respectés.
- Terminologie du domaine respectée.
- Cohérence tests : toute règle ajoutée ou modifiée dans `src/rules/` a un macro-test
  correspondant dans `tests/`.
- Cohérence doc : si un effet de terrain (`TER`) ou un raccourci a changé, le panneau
  « Terrain » / l'aide d'`index.html` a été mis à jour.

## Tests

Lancer `npm test`.

## Rapport

Liste des points avec statut, puis verdict global : conforme / à corriger.
