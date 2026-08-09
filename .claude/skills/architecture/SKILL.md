---
name: architecture
description: Use when you need the module map of CONTRE-BATTERIE, to know which layer owns a responsibility, or to decide where a given kind of new code belongs.
auto_invoke: true
---

# Architecture

Flux d'imports strictement descendant. Une couche n'importe jamais une couche située plus
bas dans ce tableau.

```
config → rules → state → render → input → loop → main        (audio à part)
```

## Carte des modules

| Module | Rôle | Dépend de |
| --- | --- | --- |
| `src/config.js` | toutes les constantes de réglage nommées | — |
| `src/rules/rng.js` | `createRng(seed)` : RNG seedable (LCG) | — |
| `src/rules/grid.js` | `ei(cx,cy)`, `clamp(v,a,b)` | `config` |
| `src/rules/los.js` | `losClear`, `underDrone`, `observed` | `config`, `grid` |
| `src/rules/reach.js` | `computeReach`→`{dist,prev}`, `pathTo` | `config`, `grid` |
| `src/rules/orders.js` | `ammoNeeded`, `blockReason` | `config`, `los` |
| `src/rules/signature.js` | `accumulateSignature`, `locationPlot`, `soundPlot` | `config`, `grid` |
| `src/rules/fire.js` | `fireShell`, `guidedSnap`, `icmSubs`, `enemySalvo` | `config`, `los` |
| `src/rules/impact.js` | `resolveImpact`→`{gunHits,enemyHits,events}` | `config`, `grid` |
| `src/rules/ai.js` | `planAI`→`{orders,pZoneUses}`, `pickSpot`, `livePlots` | `config`, `grid`, `los`, `reach` |
| `src/rules/turn.js` | `agedPlot`, `decayedThreat`, `tickDrones`, `missionOutcome` | `config` |
| `src/state/state.js` | l'objet `S`, `selUnit`, `budgetOf`, `resetMission` | `config` |
| `src/state/terrain.js` | `genTerrain(rng)` : relief, types, routes | `config`, `grid`, `state` |
| `src/render/bake.js` | `bakeTerrain`, `bakeFog`, `bakeReach`, `terrainCv/fogCv/reachCv` | `config`, `rules`, `state` |
| `src/render/effects.js` | `explode`, `paintCrater`, `paintDot`, `clearScars`, `SPR`, `scarCv` | `config`, `state` |
| `src/render/draw.js` | `draw`, `cv`, OOB, symboles tactiques | `config`, `rules`, `state`, `bake`, `effects` |
| `src/render/hud.js` | `refresh`, `refreshRead`, `orderLabel` (panneaux DOM) | `config`, `rules`, `state`, `bake` |
| `src/render/journal.js` | `log`, `sep`, `clearJournal` (journal DOM) | `state` |
| `src/input/input.js` | `initInput`, `selectUnit`, `setOrderType`, `buildAmmo`, `buildRoster` | `config`, `rules`, `state`, `render` |
| `src/loop/loop.js` | `execute`, `computeVis`, `trackEnemies`, `planAI`, `frame` | tout ce qui précède + `audio` |
| `src/audio.js` | `boom`, `muzzle`, `beep` | `state` |
| `src/main.js` | `reset`, câblage, démarrage | tout |

## État et aléa

- État unique mutable : `S` dans `src/state/state.js`. Pas d'autre global.
- RNG courant : `S.rng`, fixé par `main.reset(seed?)`. Les règles reçoivent `rng` en
  argument, ne lisent jamais `Math.random`.

## Où placer le nouveau code

| Type de changement | Où | Détail |
| --- | --- | --- |
| Nouvelle valeur de réglage (portée, seuil, proba, durée, dégâts) | `src/config.js` | constante nommée exportée ; jamais inline |
| Nouvelle décision de jeu (pure, testable) | `src/rules/<sujet>.js` | + macro-test dans `tests/` ; voir skill `rules-layer` |
| Nouveau champ d'état / entité | `src/state/state.js` | ajouter au littéral `S` et à `resetMission` |
| Changement de génération de carte | `src/state/terrain.js` | consommer `rng`, pas `Math.random` |
| Nouveau visuel (particule, symbole, couche) | `src/render/` | `effects.js`, `draw.js` ou `bake.js` selon le cas |
| Nouveau panneau / lecture HUD | `src/render/hud.js` | + éventuel `<div>` dans `index.html` |
| Nouvelle entrée (touche, clic, bouton) | `src/input/input.js` | mapper le geste vers un ordre / une sélection |
| Nouvelle étape d'orchestration (résolution, fin de tour) | `src/loop/loop.js` | appelle les règles, applique au `S`, produit effets/événements |
| Nouveau son | `src/audio.js` | synthèse Web Audio |
| Arbitrage non tranché par le code | `docs/decisions.md` | question ouverte, ne pas deviner |

Pour l'orchestration d'un tour et le cycle de vie d'un obus, voir `combat-resolution`.
