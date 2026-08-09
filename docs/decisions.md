# Refactor decisions

Written by `/refactor-game`. Records what the code cannot express: why this layout, why
this toolchain, what was deliberately not touched, what is still undecided.

Read by `/scaffold-claude` so it does not have to re-deduce any of it.

## Archetype

Selected: `plateau tour par tour` (turn-based board, archetype 2)
Why: phases `plan → resolve → over`, un ordre par unité, légalité d'ordre (`blockReason`,
`computeReach`), ligne de vue, résolution de combat, conditions de victoire, grille de
terrain — tout le vocabulaire de l'archétype est présent.
Does not fit: la phase de résolution n'est **pas** événementielle mais simulée en temps
réel via `requestAnimationFrame` — obus avec temps de vol en frames, `settle > 70` ticks
pour clore le tour, sous-munitions à retardement en ticks. `src/loop/` garde donc une vraie
boucle rAF au lieu de se réduire à un contrôleur de tour. S'y ajoute un gros état purement
visuel (particules, anneaux, feux, flashs, shake/punch/blast/freeze) séparé de l'état de
jeu mais vivant dans le même objet `S`.

## Toolchain

Branch: `zero-build`
Triggering signal: aucun signal Vite présent — pas d'import npm, pas de TypeScript, aucun
asset à bundler, ~1280 lignes de JS (< 2000). Branche par défaut de l'arbre de décision.
Node: 22
Test runner: `node:test` + `node:assert/strict`

## Layout

| Module | Responsibility | Came from |
| --- | --- | --- |
| `src/config.js` | toutes les valeurs magiques nommées | ex-lignes 151–316 |
| `src/rules/rng.js` | RNG seedable (LCG) injecté | nouveau |
| `src/rules/grid.js` | `ei`, `clamp` partagés | ex-lignes 154, 170 |
| `src/rules/los.js` | ligne de vue, observation, drone | ex-`losClear`, `observed`, `underDrone` |
| `src/rules/reach.js` | Dijkstra de portée, reconstruction de chemin | ex-`reachInto`, `pathTo` |
| `src/rules/orders.js` | légalité d'un tour de tir | ex-`blockReason`, `ammoNeeded` |
| `src/rules/signature.js` | signature acoustique, plots de contre-batterie | ex-code de `execute`, `soundRange` |
| `src/rules/fire.js` | départ des coups, guidage, ICM, salve adverse | ex-code de `execute`, `step` |
| `src/rules/impact.js` | dégâts, menace, révélation (→ événements) | ex-`impactAt` |
| `src/rules/ai.js` | choix de cible, harcèlement, repli | ex-`planAI`, `pickSpot`, `livePlots` |
| `src/rules/turn.js` | fin de tour, issue de mission | ex-`endTurn` (parties pures) |
| `src/state/state.js` | l'objet d'état `S`, sa mise en place | ex-globals + `reset` |
| `src/state/terrain.js` | génération relief/types/routes | ex-`genElev`, `genTerrainTypes` |
| `src/render/bake.js` | couches pré-rendues terrain/fog/reach | ex-`bakeTerrain`, `bakeFog`, `bakeReach` |
| `src/render/effects.js` | cicatrices, sprites, explosions, particules | ex-`paintCrater`, `explode`, `sprite` |
| `src/render/draw.js` | frame principale, OOB, symboles | ex-`draw`, `drawOOB`, `unit`, … |
| `src/render/hud.js` | panneaux latéraux DOM | ex-`refresh`, `refreshRead`, `orderLabel` |
| `src/render/journal.js` | journal de bord DOM | ex-`log`, `sep` |
| `src/input/input.js` | souris, clavier, boutons → ordres | ex-listeners, `selectUnit`, `setOrderType`, `buildAmmo`, `buildRoster` |
| `src/loop/loop.js` | orchestration résolution + fin de tour + rAF | ex-`step`, `execute`, `endTurn`, `observe`, … |
| `src/audio.js` | synthèse Web Audio | ex-`boom`, `muzzle`, `beep` |
| `src/main.js` | graine, `reset`, câblage, démarrage | ex-`reset`, `buildAmmo(); reset(); frame();` |

## Rules extracted

| Rule | Module | Test | Notes |
| --- | --- | --- | --- |
| Ligne de vue / observation | `los.js` | `tests/los.test.js` | pure, bois + masque de relief |
| Portée de mouvement / chemin | `reach.js` | `tests/reach.test.js` | coûts terrain, dénivelé, bandeau nord |
| Légalité de tir | `orders.js` | `tests/orders.test.js` | stock, portée, guidé-sans-observation |
| Signature / plots | `signature.js` | `tests/signature.test.js` | accumulation, plot loc + acoustique |
| Balistique | `fire.js` | `tests/fire.test.js` | départ, guidage, ICM, salve adverse |
| Résolution d'impact | `impact.js` | `tests/impact.test.js` | dégâts/menace/révélation en événements |
| IA adverse | `ai.js` | `tests/ai.test.js` | cible, harcèlement, repli (RNG imposé) |
| Fin de tour | `turn.js` | `tests/turn.test.js` | vieillissement plot, menace, issue |

## Randomness and time

| Call site | Classification | Handling |
| --- | --- | --- |
| `execute`, `soundRange` (dispersion, plots) | rule-bearing | RNG seedé injecté (`S.rng`) |
| `planAI`, `pickSpot` (décisions IA) | rule-bearing | RNG seedé injecté |
| `fire.js` / `step` (bruit de tir, ICM, guidage) | rule-bearing | RNG seedé injecté |
| `state.js` / `terrain.js` (mise en place, carte) | rule-bearing | RNG seedé injecté |
| `bakeTerrain` (bouleaux, brins de marais, éclats) | cosmetic | `Math.random` laissé dans render |
| `paintCrater`, `explode` (angles, vitesses, tailles) | cosmetic | `Math.random` laissé dans render |
| `draw` (translation de shake) | cosmetic | `Math.random` laissé dans render |
| `audio.nbuf` (bruit blanc) | cosmetic | `Math.random` laissé dans audio |

Seed: `from Math.random at reset` — `main.reset(seed?)` accepte une graine optionnelle
(déterministe pour les tests) et retombe sur `Math.random` sinon. Le code de règles ne lit
jamais `Math.random` : il reçoit `S.rng`. Aucune source de temps dans les règles — seul
`requestAnimationFrame` compte les frames, dans `loop/`.

## Deliberately left alone

Behaviour that looks wrong but was preserved, because the refactor must not change the
game. Each entry: what it is, where, and why it was not fixed.

- `6.29` utilisé partout à la place de `2*PI` (nombreux appels `arc(...,6.29)` dans
  `render/`). Conservé à l'identique ; non nommé, non corrigé — corriger changerait
  imperceptiblement le rendu des cercles.
- `SIG_MAX` (config) déclaré mais jamais lu par la logique. Conservé tel quel.
- HP de l'observateur affiché « 4 » en dur dans le HUD alors qu'il est indestructible
  (`hud.js`). Conservé.
- `e.zx / e.zy / e.zr` (zone d'incertitude initiale d'une batterie) jamais mis à jour après
  l'init ; purement décoratif au rendu. Conservé.
- `bakeFog()` est désormais appelé **une fois** en fin de tour si au moins un drone expire,
  au lieu d'une fois par drone expiré (ex-boucle `endTurn`). Résultat visuel strictement
  identique (le fog est recalculé en entier) ; changement de forme, pas de comportement.
- Les plots vieillis sont recréés par copie (`{...ePlot, age}`) dans `turn.agedPlot` au lieu
  d'être mutés en place. Aucune référence partagée sur `ePlot` n'existait, comportement
  identique.
- `guns[sel]` / sélection : la logique de repli de sélection en fin de tour
  (`sel = findIndex(alive)`) est inchangée.
- Coefficients d'animation dans `loop.step` (amortissement des particules `.93 / .84 / .9`,
  croissance de poussière `.42`, décroissance des anneaux `.022 / .05`, des feux, des flashs
  `.2 / 1.1`, du shake/blast/punch `.86 / .8 / .84`). Ce sont des facteurs cosmétiques
  d'intégration frame-à-frame, du même ordre que les `Math.random` laissés dans `render/`.
  Laissés inline dans `loop/` plutôt que nommés en config : les extraire n'améliore pas la
  testabilité (aucune règle n'en dépend) et gonflerait la config d'une vingtaine de
  constantes purement visuelles. Classés cosmétiques, délibérément non extraits.

## Open questions

Decisions the code does not settle and that were not made. Never resolved by guessing.

- `s` (graine de bruit sinusoïdal dans `terrain.genElev`) : son influence exacte sur la
  diversité des cartes n'est pas quantifiée. Laissée telle quelle.
- Le stockage de `S.rng` sur l'objet d'état (une fonction dans l'état) est pragmatique pour
  éviter un module-singleton de RNG ; à reconsidérer si l'état doit un jour être sérialisé.
