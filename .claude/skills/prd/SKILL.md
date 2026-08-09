---
name: prd
description: Write a specification (PRD) for a change in CONTRE-BATTERIE without implementing anything. Use when the user wants a spec, a plan, or to think a feature through before coding.
user_invocable: true
---

# prd

Produire une **spécification**, pas du code. Ce skill n'implémente rien : il explore le code
existant pour établir la base technique, pose seulement les décisions produit, et rédige un
document dans le format fixe ci-dessous.

## Démarche

1. **Explorer** le code pour remplir la base technique : quelles couches et quels modules
   sont touchés (skill `architecture`), quelles constantes de `config.js`, quelles règles de
   `rules/` existent déjà.
2. **Poser uniquement les décisions produit** que le code ne tranche pas : intention de jeu,
   valeurs cibles, interactions voulues, ce qui est explicitement hors périmètre.
3. **Rédiger** le PRD au format fixe. Ne rien coder, ne modifier aucun fichier source.

## Format

```
# PRD — <titre>

## Objectif
Une à trois phrases : le problème de jeu résolu, l'intention.

## Base technique
Couches et modules concernés, constantes et règles existantes réutilisées
(fichiers + fonctions réels).

## Comportement
Ce que le jeu doit faire, du point de vue du joueur. Cas nominal et cas limites.

## Hors périmètre
Ce qui n'est explicitement pas fait.

## Impact par couche
config / rules / state / render / input / loop : ce qui change dans chacune.

## Critères d'acceptation
Liste vérifiable, en vocabulaire de jeu.

## Tests
Les macro-tests à écrire (fichier cible + énoncé de règle).

## Risques et questions ouvertes
Ce que le code ne tranche pas ; à reporter dans docs/decisions.md.
```

Respecter la terminologie du domaine (pièce, batterie, plot, signature, réglage). Écrire en
français.
