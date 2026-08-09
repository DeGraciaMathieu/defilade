---
name: rules-layer
description: Use when adding or changing game logic in CONTRE-BATTERIE — any pure decision or transition under src/rules/. Explains the purity contract, the module catalogue, and the procedure to add a rule.
auto_invoke: true
---

# Couche de règles

`src/rules/` contient les décisions **pures** du jeu. C'est le cœur testable : toute logique
qui décide « ce qui se passe » y vit, séparée de « comment on l'affiche ou l'entend ».

## Contrat de pureté

Un module de `src/rules/` respecte **tout** ceci :

1. Aucun `document`, `window`, `canvas`, aucun nœud DOM en entrée ou en sortie.
2. Aucun `Math.random`, `Date.now`, `performance.now`. L'aléa arrive en argument (`rng`).
3. Aucune mutation des arguments : on retourne le résultat.
4. N'importe que `config.js` et d'autres modules purs (`grid`, `los`, `reach`…). Jamais
   `render/`, `input/`, `loop/`, `state/`.
5. Mêmes entrées → mêmes sorties, dans n'importe quel ordre.

Si une fonction ne peut pas respecter 1–5, ce n'est pas une règle : c'est de
l'orchestration, elle va dans `loop/`.

Les règles **émettent des décisions ou des événements**, elles n'appliquent pas d'effet.
Exemple : `impact.resolveImpact` renvoie `{ gunHits, enemyHits, events }` ; c'est `loop.js`
qui applique les dégâts au `S` et journalise les `events`.

## Catalogue des modules

| Module | Fonctions clés | Décision rendue |
| --- | --- | --- |
| `rng.js` | `createRng(seed)` | générateur pseudo-aléatoire déterministe |
| `grid.js` | `ei(cx,cy)`, `clamp(v,a,b)` | index de cellule, bornage |
| `los.js` | `losClear(ter,elev,ox,oy,tx,ty)`, `observed(vis,drones,x,y)`, `underDrone` | qui voit quoi |
| `reach.js` | `computeReach(ter,elev,px,py,budget)`→`{dist,prev}`, `pathTo(...)` | où une unité peut aller, par quel chemin |
| `orders.js` | `blockReason(guns,stock,vis,drones)`, `ammoNeeded(guns)` | un tour est-il exécutable |
| `signature.js` | `accumulateSignature`, `locationPlot(x,y,sig,rng)`, `soundPlot(plot,x,y,rng)` | signature acoustique, plots de contre-batterie |
| `fire.js` | `fireShell`, `guidedSnap`, `icmSubs`, `enemySalvo` | trajectoire et éclatement des coups |
| `impact.js` | `resolveImpact(x,y,A,side,ter,guns,enemies,turn)` | dégâts, menace, révélation |
| `ai.js` | `planAI(enemies,guns,pZone,ctx,rng)`, `pickSpot`, `livePlots` | ordres des batteries adverses |
| `turn.js` | `agedPlot`, `decayedThreat`, `tickDrones`, `missionOutcome` | ce que la fin de tour change |

`fire.js`, `impact.js`, `signature.js`, `turn.js` racontent la résolution d'un tir : leur
enchaînement est décrit dans le skill `combat-resolution`. `ai.js` a son propre skill
`enemy-ai`. `los.js` et `reach.js` sont couverts par `terrain-vision`.

## Ajouter une règle

1. **La valeur d'abord.** Toute constante de réglage (seuil, portée, proba, durée, dégâts)
   va dans `src/config.js` comme export nommé. Jamais de littéral de réglage dans la règle.
2. **Écrire la fonction pure** dans le bon module de `src/rules/` (ou en créer un si le sujet
   est neuf). Signature : prendre l'état utile en argument, retourner une valeur. Si elle a
   besoin d'aléa, ajouter `rng` en dernier paramètre.
3. **L'appeler depuis l'orchestration** (`loop/`, parfois `input/` ou `state/`) : c'est
   l'appelant qui applique le résultat au `S` et produit les effets (journal, son, DOM).
4. **Écrire le macro-test** dans `tests/<module>.test.js` — comportement, pas implémentation.
   Voir le skill `testing`.
5. **`npm test` au vert** avant de continuer.
6. **Jouer la partie** (`npm run dev`) pour confirmer le comportement en jeu.

Si l'extraction échoue deux fois, s'arrêter : la décomposition est probablement à revoir.
Tout point que le code ne tranche pas → `docs/decisions.md`.
