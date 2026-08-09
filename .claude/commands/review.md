---
description: Revue complète du diff courant — conventions, tests, maintenabilité, cohérence système.
---

# review

Revue la plus complète du changement en cours dans CONTRE-BATTERIE.

## Périmètre

1. Lire `CLAUDE.md` pour les conventions du projet.
2. Récupérer le diff : `git diff`, `git diff --cached`, `git status`,
   `git log --oneline -5`.
3. Si rien n'a changé, l'indiquer et s'arrêter.

## Vérifications

Pour chaque point, statut **OK / VIOLATION / N/A** avec le fichier:ligne concerné.

### Conventions (`CLAUDE.md`)
- Aucun `document`/`window`/`canvas`/DOM dans `src/rules/`.
- Aucun `Math.random`/`Date.now`/`performance.now` dans `src/rules/` (aléa via `rng` injecté).
- Aucune valeur magique de réglage hors `src/config.js` (hors cosmétiques documentées dans
  `docs/decisions.md`).
- Sens des imports descendant : `config → rules → state → render → input → loop → main` ;
  jamais une règle qui importe `render/`/`input/`/`loop/`/`state/`.
- Les règles retournent des décisions/événements, n'appliquent pas d'effet (pas de journal,
  son ou mutation d'état dans `rules/`).
- Terminologie du domaine respectée (pièce, batterie, plot, signature, réglage).

### Couverture de test
- Toute nouvelle règle de `src/rules/` a un macro-test dans `tests/`.
- Les tests portent sur le comportement, pas sur l'implémentation.
- `npm test` est au vert (voir plus bas).

### Maintenabilité
- Couplage, responsabilité unique, duplication.
- Longueur / complexité des fonctions, nommage.
- Valeurs magiques.

### Cohérence système
- Intégration avec l'existant (bonne couche, bon module — cf. skill `architecture`).
- Forme de l'état / des données cohérente avec `S` et les patterns établis.
- Respect des flux décrits par les skills `combat-resolution`, `enemy-ai`, `terrain-vision`.
- Doc vivante : si un effet de terrain ou un raccourci a changé, le panneau « Terrain » /
  l'aide d'`index.html` a-t-il suivi ?

## Tests

Lancer `npm test` et intégrer le résultat au rapport.

## Rapport

Un tableau par section avec le statut par point, puis un **verdict global** :
approuvé / à corriger, avec la liste ordonnée des corrections nécessaires.
