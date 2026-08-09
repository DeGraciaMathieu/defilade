---
name: terrain-vision
description: Use when working on the map, line of sight, movement reach or fog in CONTRE-BATTERIE — terrain generation, what each terrain does, LOS through woods and ridges, movement cost, and drone-opened visibility.
auto_invoke: true
---

# Terrain et visibilité

Le sous-système spatial : la carte, ce que chaque terrain fait, qui voit quoi, et où une
unité peut aller. Il traverse trois couches — génération (`state`), décisions (`rules`),
affichage (`render`).

## Terrain

La grille fait `COLS × ROWS` cellules de `CELL` px (voir `config.js`). Deux tableaux
parallèles dans `S` : `S.ter` (type, `Uint8Array`) et `S.elev` (altitude, `Float32Array`).
Index : `grid.ei(cx,cy)`.

Types dans `TER` (`config.js`), chacun `{ n, cost, blast, los, c }` :

| Type | `cost` (mouvement) | `blast` (éclats) | `los` |
| --- | --- | --- | --- |
| Découvert | 1 | 1 | oui |
| Bois | 1.8 | .85 | **non** (masque la vue) |
| Route | .5 | 1.15 | oui |
| Marais | 2.5 | .55 (étouffe) | oui |
| Rocaille | 1.4 | 1.35 (amplifie) | oui |

Ces effets sont décrits au joueur dans le panneau **« Terrain »** d'`index.html` : si tu
changes `cost`/`blast`/`los`, mets ce panneau à jour (le hook de synchro doc le vérifie).

## Concepts → implémentation

| Concept | Où | Détail |
| --- | --- | --- |
| Génération de carte | `state.genTerrain(rng)` | relief sinusoïdal + collines, puis marais/rocaille/bois/routes ; consomme `rng` |
| Ligne de vue | `los.losClear(ter,elev,ox,oy,tx,ty)` | bloquée par un bois ou une crête plus haute sur le trajet |
| Observation | `los.observed(vis,drones,x,y)` | vrai si la cellule est visible **ou** sous un drone |
| Champ de l'observateur | `loop.computeVis()` | remplit `S.vis` ; portée réduite (`WOOD_VIS_R`) sous couvert |
| Portée de mouvement | `reach.computeReach(ter,elev,px,py,budget)` | Dijkstra pondéré par `cost` + dénivelé ; bandeau nord interdit |
| Chemin | `reach.pathTo(px,py,tx,ty,prev)` | reconstruit depuis la carte `prev` |
| Budget d'une unité | `state.budgetOf(u)` | `MOVE_OBS` pour l'observateur, sinon `MOVE_GUN` |
| Brouillard / drone | `render/bake.bakeFog()` | assombrit l'invisible, ouvre un disque sous chaque drone (`DRONE_R`) |
| Aperçu de portée | `render/bake.bakeReach()` | remplit `S.uiDist`/`S.uiPrev` et la couche `reachCv` |

Le suivi ennemi (`loop.trackEnemies`) utilise `observed` pour marquer `e.seen` et mémoriser
la dernière position vue (`e.lk`).

## Modifier ce sous-système

1. Nouveau paramètre (portée de vue, coût, seuil de relief, rayon de drone) → constante
   nommée dans `config.js` (`VIS_R`, `CLIMB_COST`, `DRONE_R`, préfixes `*_R`…).
2. Décision spatiale pure (visibilité, coût, chemin) → `los.js` ou `reach.js`, en respectant
   le contrat de pureté (RNG injecté pour la génération, pas de DOM).
3. Génération de carte → `state.genTerrain`, en consommant `S.rng` et non `Math.random`
   (l'aléa de carte est *rule-bearing*, il doit rester déterministe sous graine).
4. Affichage (brouillard, couches, teintes) → `render/bake.js` ; l'aléa purement visuel des
   textures y reste en `Math.random` (cosmétique, cf. `docs/decisions.md`).
5. Si un terrain change d'effet, **synchroniser le panneau « Terrain » d'`index.html`**.
6. Tester dans `tests/los.test.js` / `tests/reach.test.js`, `npm test` au vert, puis partie.
