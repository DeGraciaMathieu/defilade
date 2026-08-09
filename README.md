# CONTRE-BATTERIE

Un jeu d'artillerie tour par tour : trois pièces contre trois batteries adverses, sur une
carte à relief, bois, marais et routes. Le terrain masque la vue et étouffe les éclats ;
chaque départ trahit une signature acoustique que l'ennemi affine pour riposter.

> ⚠️ **Ouvrir `index.html` par double-clic ne fonctionne plus.** Le jeu est découpé en
> modules ES natifs, que le navigateur refuse de charger via `file://`. Il faut passer par
> un serveur HTTP local (voir ci-dessous).

## Lancer le jeu

```bash
npm run dev
```

Cela sert le répertoire courant (via `npx serve .`) ; ouvrez ensuite l'URL affichée et
chargez `index.html`. N'importe quel serveur statique convient, par exemple :

```bash
python3 -m http.server
```

## Tester

```bash
npm test          # lance toute la suite (node:test)
npm run test:watch
```

Les tests couvrent la couche de règles (`src/rules/`) : ligne de vue, portée de mouvement,
légalité des ordres, signature/plots, balistique, résolution d'impact, IA adverse et fin de
tour.

## Structure

```
index.html         coquille HTML/CSS, charge src/main.js en module
src/
  config.js        toutes les valeurs de réglage nommées
  rules/           décisions pures et testables (RNG injecté, aucun DOM)
  state/           l'état du jeu et la génération de carte
  render/          tout ce qui écrit à l'écran (canvas + panneaux DOM)
  input/           souris, clavier, boutons → ordres
  loop/            orchestration : intention → règle → état → rendu
  audio.js         synthèse Web Audio
  main.js          graine, mise en place, câblage, démarrage
tests/             macro-tests des règles
docs/decisions.md  choix de refactor et comportements préservés
```

Prérequis : **Node 22+** (ESM natif, runner de test intégré).

## Commandes en jeu

`1 2 3` sélectionne une pièce · `4` l'observateur · `F M S` type d'ordre
(feu / mouvement / silence) · `A Z E R T` munition · `Espace` exécute le tour ·
`N` nouvelle mission.
