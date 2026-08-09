# CONTRE-BATTERIE

Jeu d'artillerie tour par tour : trois pièces contre trois batteries adverses sur une carte
à relief, bois, marais et routes, où le terrain masque la vue, étouffe les éclats et où
chaque départ trahit une signature acoustique que l'ennemi affine pour riposter.

## Stack

- **JavaScript vanilla, modules ES natifs, sans build.** Node ≥ 22 (ESM natif + runner de
  test intégré). Gestionnaire : npm.
- Aucune dépendance de runtime, aucune dépendance de dev. Tout le graphisme est procédural
  (canvas 2D), tout le son est synthétisé (Web Audio).
- Commandes :
  - `npm run dev` — sert le répertoire (`npx serve .`) ; ouvrir l'URL puis `index.html`.
  - `npm test` — toute la suite (`node --test`).
  - `npm run test:watch` — la suite en continu.
- Pas de lint ni de formatter configuré : les conventions ci-dessous sont documentées mais
  pas vérifiées automatiquement.

> Ouvrir `index.html` par double-clic ne fonctionne pas : les modules ES ne se chargent pas
> en `file://`. Toujours passer par un serveur HTTP local.

## Architecture

Le flux d'imports est **strictement descendant**, jamais l'inverse :

```
config → rules → state → render → input → loop → main        (audio à part)
```

| Couche | Rôle | Peut importer |
| --- | --- | --- |
| `src/config.js` | toutes les constantes de réglage nommées | rien |
| `src/rules/` | décisions **pures** et testables | `config` (+ sœurs pures) |
| `src/state/` | l'objet d'état `S`, sa mise en place, la carte | `config`, `rules` |
| `src/render/` | tout ce qui écrit à l'écran (canvas + DOM) | `config`, `state`, `rules` |
| `src/input/` | souris, clavier, boutons → ordres | `config`, `state`, `rules`, `render` |
| `src/loop/` | orchestration : intention → règle → état → rendu | tout ce qui précède |
| `src/main.js` | graine, mise en place, câblage, démarrage | tout |

L'état unique vit dans `S` (`src/state/state.js`). Le RNG courant est `S.rng`, fixé par
`main.reset(seed?)`.

## Conventions non négociables

Ces règles font la valeur du refactor. Les enfreindre casse la testabilité ou le
déterminisme.

1. **Aucun DOM dans `src/rules/`.** Pas de `document`, `window`, `canvas`, ni nœud DOM en
   entrée ou en sortie. Une fonction de règle prend l'état (ou des morceaux d'état) et
   retourne une décision ou un prochain état.
2. **Aucun `Math.random` / `Date.now` / `performance.now` dans `src/rules/`.** L'aléa de
   règle passe par un RNG **injecté** en argument (`rng`), jamais lu globalement. Seul
   `main` décide de la graine. L'aléa purement cosmétique (particules, textures, shake,
   bruit blanc) reste dans `render/` et `audio.js` — voir `docs/decisions.md`.
3. **Aucune mutation des arguments dans les règles.** On retourne le résultat, on ne modifie
   pas l'objet reçu (voir `turn.agedPlot`, `impact.resolveImpact` qui renvoient des
   descripteurs, pas des mutations).
4. **Aucune valeur magique de réglage hors `src/config.js`.** Vitesses, portées, seuils,
   probabilités, durées, dégâts : constante nommée exportée. Exceptions cosmétiques (facteurs
   d'animation, `6.29` ≈ 2π) documentées dans `docs/decisions.md`.
5. **Le sens des imports ne remonte jamais.** En particulier, une règle qui importerait un
   renderer est le défaut à traquer. `input/` reçoit `execute`/`reset` par injection
   (`initInput`) plutôt que d'importer `loop/`.
6. **Les règles émettent des événements, pas des effets.** Les messages du journal, le son
   et le DOM sont produits par `loop/` à partir de ce que les règles retournent (ex.
   `resolveImpact` renvoie `{ gunHits, enemyHits, events }`).

## Conventions de code

- Un seul objet d'état mutable `S` ; on n'introduit pas de nouvel état global parallèle.
- Les entités sont des objets simples dans des tableaux (`S.guns`, `S.enemies`, `S.shells`…),
  pas des classes.
- Terminologie du domaine, en français : *pièce* (canon ami), *batterie* (canon adverse),
  *observateur*, *plot* (localisation estimée), *signature* (empreinte acoustique), *réglage*,
  *décrocher* (se déplacer en perdant son réglage). La garder telle quelle.
- Commentaires et documentation en **français**.

## Comportement (process)

- **Ne jamais déclarer une tâche finie sans avoir lancé `npm test` et vu la suite au vert.**
- Si une approche échoue deux fois, s'arrêter et revoir le plan plutôt que tenter une
  troisième variante.
- Toute nouvelle valeur de réglage va dans `config.js`. Toute nouvelle règle va dans
  `rules/` avec son macro-test. Tout ce que le code ne tranche pas va dans
  `docs/decisions.md` comme question ouverte — ne jamais deviner.
- Le comportement de jeu est la référence : un changement de comportement non demandé est un
  bug.

## Skills disponibles

- `rules-layer` — la couche de règles pures : contrat de pureté, catalogue des modules,
  ajouter une règle.
- `combat-resolution` — l'orchestration d'un tour : `execute → resolve → endTurn`, cycle de
  vie d'un obus, où vivent effets et événements.
- `enemy-ai` — l'IA de contre-batterie : choix de cible, menace, plots, harcèlement, repli.
- `terrain-vision` — génération de carte, ligne de vue, portée de mouvement, brouillard,
  drones.
- `architecture` — carte des modules et où placer le nouveau code selon le type de
  changement.
- `testing` — commande, philosophie macro-test, mapping test → périmètre, où ajouter un test.
- `feature` *(invocable)* — implémenter une fonctionnalité dans l'architecture, testée.
- `prd` — rédiger une spécification sans rien implémenter.
