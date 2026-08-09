---
name: combat-resolution
description: Use when working on how a turn plays out in CONTRE-BATTERIE — order execution, a shell's flight-to-impact lifecycle, the ammunition types, damage/signature/threat, and end-of-turn. This is the loop that ties the pure rules to state and effects.
auto_invoke: true
---

# Résolution du combat

La partie enchaîne trois phases dans `S.phase` : `plan` (le joueur donne des ordres),
`resolve` (simulation temps réel des mouvements et des tirs), `over` (bannière de fin).
L'orchestration vit dans `src/loop/loop.js` ; elle appelle les règles pures et applique
leurs résultats au `S`, en produisant les effets (journal, son, visuel).

## Enchaînement d'un tour

| Étape | Fonction | Ce qui se passe |
| --- | --- | --- |
| Déclenchement | `loop.execute()` | refuse si `blockReason(...)` non vide ; passe en `resolve`, transforme chaque ordre en mouvement ou en obus |
| Tir ami | `fire.fireShell(g,o,rng)` | crée l'obus (biais de pièce + bruit, temps de vol) ; `signature.accumulateSignature` + `locationPlot` mettent à jour la signature et le plot que l'ennemi obtient |
| Tir adverse | `fire.enemySalvo(e,at,rng)` | salve de trois obus ; `signature.soundPlot` affine le plot acoustique |
| Boucle temps réel | `loop.step()` | avance `S.rt`, déplace les unités, fait mûrir les obus |
| Fin de vol | `loop.step()` (branches par munition) | voir tableau des munitions |
| Impact | `loop.impactAt` → `impact.resolveImpact` | applique `gunHits`/`enemyHits` au `S`, journalise les `events` ; `explode` + `boom` pour le visuel/son |
| Observation | `loop.observe` | messages d'ajustement (« allongez / raccourcissez ») si l'impact est vu |
| Clôture | `loop.endTurn()` | quand plus rien ne bouge après `SETTLE_TICKS` : `tickDrones`, `agedPlot`, `decayedThreat`, `missionOutcome`, sinon relance `planAI` et repasse en `plan` |

`explode(x,y,power,enemyFire,seen)` (`render/effects.js`) ne fait que du visuel ; `seen` est
décidé par la boucle (`observed(...)`) et le son (`boom`) est joué par la boucle, pas par la
règle.

## Cycle de vie d'un obus (`loop.step`)

Un obus (`S.shells[i]`) mûrit tant que `++s.t < s.dur`. À échéance, la branche dépend de
`s.side` et `s.type` :

| Munition | Branche à l'échéance |
| --- | --- |
| `gui` (guidé, ami) | `fire.guidedSnap` : recale sur l'objectif observé le plus proche (< `GUIDED_SNAP_R`) |
| `rec` (obus-drone) | pousse un drone (`DRONE_TURNS` tours), recalcule la visibilité, `beep`, pas d'impact |
| `icm` (bombelettes) | `fire.icmSubs` : sème `S.subs` (sous-munitions à retardement), puis `observe` |
| `he` / `reg` / autre | `impactAt` direct, puis `observe` si côté ami |

Les sous-munitions `S.subs` décomptent leur délai puis appellent `impactAt`.

## Munitions

Définies dans `AMMO` (`config.js`), listées par `ORDER`. Champs : `key` (touche), `name`,
`start` (stock initial), `thr` (menace infligée), `sig` (signature générée), `power` (visuel
d'explosion), `kill` (rayon létal), `reveal` (rayon de révélation), plus `spread`/`subs`
pour l'ICM.

### Ajouter une munition

1. Ajouter l'entrée dans `AMMO` (`config.js`) et son id dans `ORDER`. La touche
   (`AMMO[id].key`) est prise en compte automatiquement par `input.js`.
2. Si elle a un comportement spécial en fin de vol (comme `gui`/`rec`/`icm`), ajouter sa
   branche dans `loop.step`, en s'appuyant sur une fonction pure de `fire.js` pour toute
   décision (dispersion, recalage…).
3. Régler dégâts/menace/révélation via ses champs — `impact.resolveImpact` les lit déjà ; ne
   pas coder de cas particulier de dégâts dans la boucle.
4. Ajouter l'aperçu de visée dans `render/draw.js` (rayon dessiné selon `spread`/`kill`).
5. Macro-tests de la partie décisionnelle dans `tests/fire.test.js` / `tests/impact.test.js`.
6. `npm test` au vert, puis partie à la main.

Toute nouvelle constante (temps de vol, rayon, délai) → `config.js`.
