---
name: testing
description: Use when writing, running, or reasoning about tests in CONTRE-BATTERIE — the test command, the macro-test philosophy, which file covers what, and where a new test goes.
auto_invoke: true
---

# Testing

## Commande

```bash
npm test            # toute la suite, via node --test
npm run test:watch  # en continu
```

Runner : `node:test` + `node:assert/strict`, sans dépendance. Les tests vivent dans
`tests/*.test.js` et importent depuis `src/rules/`.

## Philosophie : macro-tests

On teste **ce qu'un joueur remarquerait**, dans le vocabulaire du domaine — pas la forme
interne d'une fonction.

- Bien : « le marais étouffe les éclats : même distance, aucun dégât », « décrocher deux
  fois casse l'affinage acoustique », « un objectif au-delà de la portée bloque l'exécution ».
- Mal : « `resolveImpact` retourne un tableau de longueur 2 », « le champ interne vaut 4 ».

Construire l'état avec un petit littéral explicite, pas via un helper qui masque la mise en
place. Le test doit se lire comme l'énoncé d'une règle.

### Aléa dans les tests

Les règles qui prennent un `rng` sont testées avec une graine fixe (`createRng(n)`) ou une
séquence imposée. Pour forcer une branche probabiliste de l'IA, injecter un rng qui rejoue
des valeurs précises :

```js
const seqRng = (vals) => { let i = 0; return () => vals[Math.min(i++, vals.length-1)]; };
```

Viser un ou deux tests par règle : le cas nominal et le cas limite qui a justifié la règle.
Le pourcentage de couverture n'est pas une cible.

## Mapping test → périmètre

| Fichier | Couvre |
| --- | --- |
| `tests/los.test.js` | ligne de vue (bois, masque de relief), observation par drone, hors carte |
| `tests/reach.test.js` | coûts de mouvement (marais, dénivelé), bandeau nord interdit, reconstruction de chemin |
| `tests/orders.test.js` | légalité d'un tour : stock, portée max, guidé sans observation, pièce détruite |
| `tests/signature.test.js` | accumulation de signature, plot de localisation (précision bornée), plot acoustique |
| `tests/fire.test.js` | bruit de tir guidé/non guidé, temps de vol, snap terminal, dispersion ICM, salve adverse |
| `tests/impact.test.js` | dégâts aux pièces, blast du terrain, neutralisation, menace/révélation, batterie morte |
| `tests/ai.test.js` | choix de cible, harcèlement (borné), repli sous menace, hold, point de repli côté adverse |
| `tests/turn.test.js` | vieillissement des plots, décroissance de menace, autonomie drone, issue de mission |

## Où mettre un nouveau test

- Le test suit sa règle : nouvelle fonction dans `src/rules/foo.js` → assertions dans
  `tests/foo.test.js` (créer le fichier s'il n'existe pas).
- Ne tester que la couche `rules/`. `render/`, `input/`, `loop/` ne sont pas testés
  unitairement : ils orchestrent des règles déjà couvertes et touchent le DOM.
- Si tu ressens le besoin d'une dépendance de test (DOM, mocks lourds), c'est le signe que la
  logique n'est pas assez pure : la déplacer dans `rules/` d'abord.

Un hook Stop lance `npm test` : une tâche ne peut pas se terminer suite rouge.
