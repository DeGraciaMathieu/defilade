---
name: feature
description: Implement a feature in CONTRE-BATTERIE within its layered architecture, tested at macro level. Use when the user asks to add or change gameplay.
user_invocable: true
---

# feature

Implémenter une fonctionnalité **dans** l'architecture existante, testée, sans dériver du
comportement non demandé.

## 1. Comprendre

- Reformuler la demande en une phrase, pour lever toute ambiguïté.
- Invoquer le skill `architecture` pour situer la couche concernée, et le skill domaine
  pertinent (`rules-layer`, `combat-resolution`, `enemy-ai`, `terrain-vision`).
- Poser les questions qui décident de l'implémentation, seulement celles que le code ne
  tranche pas :
  - **valeurs numériques** (portée, seuil, proba, durée, dégâts, coût) ;
  - **interaction avec l'existant** (quelle munition / terrain / phase / IA est touché) ;
  - **cas limites** (stock épuisé, unité détruite, hors portée, terrain sans LOS).

## 2. Implémenter

- Respecter `CLAUDE.md` : aucune valeur magique hors `config.js`, aucun DOM ni `Math.random`
  dans `rules/`, imports descendants, les règles retournent des décisions/événements.
- Placer chaque morceau dans sa couche (voir la table « où va le nouveau code » du skill
  `architecture`) : réglage → `config`, décision pure → `rules` (+ test), état → `state`,
  visuel → `render`, entrée → `input`, orchestration → `loop`.
- Si un point n'est pas tranché par la demande ni par le code, l'inscrire dans
  `docs/decisions.md` plutôt que deviner.

## 3. Tester

- Macro-tests de la partie décisionnelle dans `tests/<module>.test.js` (skill `testing`).
- `npm test` jusqu'au vert. Si une approche échoue deux fois, s'arrêter et revoir le plan.
- Lancer le jeu (`npm run dev`) et confirmer le comportement en situation.

## 4. Mettre à jour la documentation

Si le périmètre a bougé :
- `CLAUDE.md` et le skill concerné si une convention ou un module change ;
- le panneau **« Terrain »** ou l'**aide** d'`index.html` si un effet de terrain ou un
  raccourci change (le hook de synchro doc le vérifiera).

## 5. Résumer

Rapporter : fichiers modifiés, tests ajoutés, résultat de `npm test`, et tout arbitrage
consigné dans `docs/decisions.md`.
