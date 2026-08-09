/* Configuration du jeu — toutes les valeurs viennent du prototype d'origine, inchangées. */

/* --- canvas et grille --- */
export const W = 1040, H = 620, CELL = 20;
export const COLS = W / CELL, ROWS = H / CELL;
export const MPP = 5;                    // mètres par pixel

/* --- portées et détection --- */
export const MAXRANGE = 880;             // portée des pièces (px)
export const E_RANGE = 820;              // portée des batteries adverses (px)
export const VIS_R = 21;                 // rayon de visibilité de l'observateur (cellules)
export const WOOD_VIS_R = 5;             // sous couvert, on ne voit rien venir
export const DRONE_R = 95;               // rayon de couverture de l'obus-drone (px)
export const SIG_MAX = 2;
export const SIG_PLOT = 1;               // signature déclenchant un plot de localisation

/* --- terrain --- */
export const T_OPEN = 0, T_WOOD = 1, T_ROAD = 2, T_MARSH = 3, T_ROCK = 4;
export const TER = [
  { n:'Découvert', cost:1,   blast:1,    los:true,  c:'' },
  { n:'Bois',      cost:1.8, blast:.85,  los:false, c:'#1b2a18' },
  { n:'Route',     cost:.5,  blast:1.15, los:true,  c:'#6b5c3a' },
  { n:'Marais',    cost:2.5, blast:.55,  los:true,  c:'#243028' },
  { n:'Rocaille',  cost:1.4, blast:1.35, los:true,  c:'#3d3f33' }
];

/* --- génération de terrain --- */
export const HILL_COUNT = 11;
export const MARSH_BELOW = 13;           // altitude sous laquelle les creux se noient
export const MARSH_P = .75;
export const ROCK_ABOVE = 60;            // altitude au-dessus de laquelle les sommets se dénudent
export const ROCK_P = .65;
export const GROVE_COUNT = 10;

/* --- ligne de vue --- */
export const LOS_EYE_H = 10;             // hauteur d'œil de l'observateur
export const LOS_TGT_H = 3;              // hauteur de la cible
export const LOS_CLEARANCE = 2;          // marge de masquage par le relief

/* --- mouvement --- */
export const MOVE_GUN = 9, MOVE_OBS = 13;
export const DIAG_COST = 1.414;
export const CLIMB_COST = .014;          // coût par unité de dénivelé montant
export const NO_DEPLOY_ROWS = 2;         // bandeau nord : on ne s'installe pas sous l'OOB
export const MOVE_TICKS = 120;           // durée d'un déplacement en ticks de résolution

/* --- munitions --- */
export const AMMO = {
  reg: { key:'A', name:'Réglage', start:Infinity, thr:.5, sig:.5, power:.45, kill:0, reveal:26,
    desc:'Charge réduite. Ne détruit rien, demi-signature.' },
  he:  { key:'Z', name:'Explosif', start:20, thr:1, sig:1, power:1, kill:22, reveal:44,
    desc:'La munition d\'effet. Signature pleine.' },
  icm: { key:'E', name:'Bombelettes', start:6, thr:.16, sig:1.4, power:.55, kill:15, reveal:28,
    spread:74, subs:7, desc:'Sept sous-munitions. Couvre une batterie qui décroche.' },
  gui: { key:'R', name:'Guidé', start:3, thr:1, sig:1, power:1.15, kill:26, reveal:50,
    desc:'Se recale en vol sur un objectif observé.' },
  rec: { key:'T', name:'Obus-drone', start:4, thr:0, sig:.5, power:0, kill:0, reveal:0,
    desc:'Drone en station trois tours. Ouvre le terrain mort.' }
};
export const ORDER = ['reg','he','icm','gui','rec'];

/* --- tir ami --- */
export const FLIGHT_BASE = 58;           // durée de vol : FLIGHT_BASE + R*FLIGHT_PER_PX (frames)
export const FLIGHT_PER_PX = .075;
export const AIM_NOISE_GUIDED = 8;       // amplitude totale du bruit, tirage (rnd-.5)*N
export const AIM_NOISE_UNGUIDED = 12;
export const MOVE_BIAS = 90;             // biais de pointage repris après un déplacement (bx/by)
export const GUIDED_SNAP_R = 150;        // rayon de capture du guidage terminal
export const GUIDED_SNAP_NOISE = 8;
export const ICM_SUB_STAGGER = 6;        // ticks entre deux sous-munitions
export const DRONE_TURNS = 3;            // autonomie de l'obus-drone en tours

/* --- signature et plots --- */
export const SIG_SAME_POS = 30;          // distance sous laquelle la signature s'accumule
export const PLOT_ERR_BASE = 160;        // err = clamp(PLOT_ERR_BASE/sig, MIN, MAX)
export const PLOT_ERR_MIN = 20;
export const PLOT_ERR_MAX = 160;
export const SOUND_ERR_INIT = 115;       // plot acoustique : erreur initiale
export const SOUND_ERR_IMPROVE = 34;     // amélioration par tir depuis la même position
export const SOUND_ERR_MIN = 28;
export const SOUND_SAME_POS = 25;        // distance sous laquelle la batterie n'a « pas bougé »
export const SOUND_SCATTER = .6;         // dispersion du plot autour de la vraie position

/* --- tir adverse --- */
export const E_FLIGHT_BASE = 70;
export const SALVO_SIZE = 3;
export const SALVO_STAGGER = 13;         // frames entre deux obus d'une salve
export const SALVO_SPREAD = 55;          // dispersion d'une salve (px)

/* --- impacts --- */
export const FRAG_R = 32;                // rayon d'éclats sur nos pièces, modulé par le terrain
export const FRAG_KILL_R = 15;           // rayon de dommage grave
export const FRAG_KILL_DMG = 2;          // HP retirés dans le rayon de dommage grave
export const FRAG_DMG = 1;               // HP retirés par des éclats plus lointains
export const SPOT_TICKS = 20;            // durée de révélation d'une batterie après un impact proche
export const THREAT_R = 220;             // un impact plus près que ça augmente la menace
export const THREAT_MAX = 4;
export const GUN_HP = 2;

/* --- observation des impacts --- */
export const OBSERVE_NEAR = 260;         // au-delà, « rien à proximité »
export const OBSERVE_GOOD = 90;          // en deçà, le message d'ajustement passe en 'ok'

/* --- tour --- */
export const SETTLE_TICKS = 70;          // ticks de calme avant de clore la résolution
export const VIS_RECALC_PERIOD = 8;      // recalcul de la visibilité pendant le déplacement de l'observateur
export const THREAT_DECAY = .6;          // décroissance de la menace par tour
export const PLOT_STALE_AGE = 2;         // tours avant qu'un plot périmé disparaisse

/* --- IA adverse --- */
export const AI_PICK_BEST_P = .7;        // probabilité de choisir le plot le plus précis
export const AI_STALE_FIRE_P = .35;      // tir sur une position abandonnée
export const AI_THREAT_FLINCH = 2.5;     // menace au-delà de laquelle elle hésite à décrocher
export const AI_FLINCH_MOVE_P = .45;
export const AI_THREAT_MOVE = 2;         // menace déclenchant le repli défensif
export const AI_RESTLESS_P = .16;        // mouvement défensif sans menace
export const AI_HARASS_P = .34;          // harcèlement de la zone de déploiement supposée
export const PZONE_MAX_USES = 5;
export const AI_SAMPLES = 42;            // positions candidates évaluées par repositionnement
export const AI_MIN_MOVE = 2;            // points de mouvement minimum d'un repositionnement
export const AI_KEEP_X = 400;            // les batteries ne se replient pas côté joueur (px)
export const AI_SPACING = 90;            // espacement souhaité entre deux batteries (px)
export const SCORE_JITTER = 10;
export const SCORE_UNSEEN = 45;
export const SCORE_WOOD = 30;            // le couvert vaut mieux qu'un simple masque de crête
export const SCORE_MARSH = 35;           // on n'installe pas une pièce dans un marécage
export const SCORE_ROAD = 15;            // trop exposé pour rester
export const SCORE_IN_RANGE = 30;
export const SCORE_OUT_RANGE = 70;
export const SCORE_ELEV_W = .1;
export const SCORE_DIST_W = 2.5;
export const SCORE_SPACING_PEN = 25;

/* --- mise en place de la mission --- */
export const GUN_X_MIN = 100, GUN_X_SPAN = 90;
export const GUN_Y_TOP = 110, GUN_Y_STEP = 190, GUN_Y_JITTER = 50;
export const FO_DX = 170;                // l'observateur part devant la pièce du centre
export const PZONE_JX = 130, PZONE_JY = 200, PZONE_R = 150;
export const ENEMY_X_MIN = 640, ENEMY_X_SPAN = 340;
export const ENEMY_Y_TOP = 105, ENEMY_Y_STEP = 175, ENEMY_Y_JITTER = 60;
export const ZONE_JITTER = 130;          // zone d'incertitude initiale des batteries
export const ZONE_R_MIN = 95, ZONE_R_SPAN = 50;

/* --- effets --- */
export const MAX_PARTS = 700;
