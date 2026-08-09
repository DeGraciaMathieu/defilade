---
name: enemy-ai
description: Use when working on the counter-battery AI in CONTRE-BATTERIE — how enemy batteries choose to fire, harass, hold or fall back, the threat model, and the location plots they act on.
auto_invoke: true
---

# IA de contre-batterie

Les trois batteries adverses décident chaque tour, en aveugle sur nos positions exactes :
elles n'agissent que sur les **plots** (localisations estimées) et sur leur niveau de
**menace**. Toute la décision est pure, dans `src/rules/ai.js` ; `loop.planAI()` la relie au
`S`.

## Concepts → implémentation

| Concept | Où | Détail |
| --- | --- | --- |
| Plots vivants | `ai.livePlots(guns)` | nos pièces plottées (`g.ePlot`) que l'ennemi croit localiser |
| Plan du tour | `ai.planAI(enemies, guns, pZone, ctx, rng)` | retourne `{ orders, pZoneUses }` ; un ordre par batterie |
| Point de repli | `ai.pickSpot(e, ctx, rng)` | échantillonne `AI_SAMPLES` cases atteignables, les note, garde la meilleure |
| Menace | `e.threat` (état) | montée par nos impacts proches (`impact.resolveImpact`), redescend via `turn.decayedThreat` |
| Zone de harcèlement | `S.pZone` | ce que l'ennemi suppose de notre déploiement initial ; `uses` plafonné à `PZONE_MAX_USES` |
| Câblage | `loop.planAI()` | pose `S.eOrders` et reporte `pZone.uses` |
| Application des ordres | `loop.execute()` | transforme chaque `eOrders[i]` en salve (`enemySalvo`) ou en mouvement |

`ctx` passé à `planAI`/`pickSpot` regroupe `{ ter, elev, vis, drones, guns, enemies }`.

## Arbre de décision d'une batterie (`ai.planAI`)

1. Plots frais à portée (`E_RANGE`) → **tir**, en préférant le plus précis avec proba
   `AI_PICK_BEST_P` ; mais sous forte menace (`≥ AI_THREAT_FLINCH`) elle peut décrocher.
2. Sinon plots périmés à portée → **tir** sur une position abandonnée avec proba
   `AI_STALE_FIRE_P`.
3. Sinon aucune cible mais `pZone` disponible → **harcèlement** de la zone supposée avec
   proba `AI_HARASS_P·(1−uses/PZONE_MAX_USES)`.
4. Sinon menace `≥ AI_THREAT_MOVE` → **repli**.
5. Sinon proba `AI_RESTLESS_P` → **mouvement défensif**, à défaut **hold**.

Score de `pickSpot` : bonus couvert/hors-vue, malus marais/route, préférence pour rester à
portée d'un plot, écart aux batteries voisines (`AI_SPACING`), jamais côté joueur
(`x ≥ AI_KEEP_X`). Tous les poids sont dans `config.js` (préfixe `SCORE_`, `AI_`).

## Modifier l'IA

1. Nouveaux poids / seuils / probabilités → constantes nommées dans `config.js`
   (`AI_*`, `SCORE_*`), jamais de littéral dans `ai.js`.
2. Modifier la décision dans `ai.planAI` / `ai.pickSpot` en gardant la pureté : pas de DOM,
   `rng` injecté, pas de mutation des entrées (l'IA **retourne** des ordres, elle ne touche
   pas `S`).
3. `loop.planAI` / `loop.execute` appliquent le résultat — c'est là que vont les effets
   (journal « Mouvement observé », son, `S.eOrders`).
4. Tester dans `tests/ai.test.js` en forçant les branches avec un rng à séquence imposée
   (voir skill `testing`). Vérifier notamment les invariants : harcèlement borné à
   `PZONE_MAX_USES`, repli toujours côté adverse.
5. `npm test` au vert, puis partie à la main.
