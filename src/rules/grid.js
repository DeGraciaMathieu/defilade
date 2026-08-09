/* Aides de grille partagées par les règles. */
import { COLS } from '../config.js';

export const ei = (cx, cy) => cy*COLS + cx;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
