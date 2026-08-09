/* Signature acoustique des pièces et plots de contre-batterie. */
import {
  SIG_SAME_POS, SIG_PLOT, PLOT_ERR_BASE, PLOT_ERR_MIN, PLOT_ERR_MAX,
  SOUND_SAME_POS, SOUND_ERR_INIT, SOUND_ERR_IMPROVE, SOUND_ERR_MIN, SOUND_SCATTER
} from '../config.js';
import { clamp } from './grid.js';

/* Chaque départ depuis la même position accumule la signature ; bouger repart de zéro. */
export function accumulateSignature(sig, sigPos, x, y, ammoSig){
  if (sigPos && Math.hypot(x-sigPos.x, y-sigPos.y) < SIG_SAME_POS)
    return { sig: sig + ammoSig, sigPos };
  return { sig: ammoSig, sigPos: { x, y } };
}

/* Au-delà du seuil, l'adversaire obtient un plot d'autant plus précis que la signature est forte. */
export function locationPlot(x, y, sig, rng){
  if (sig < SIG_PLOT) return null;
  const err = clamp(PLOT_ERR_BASE/sig, PLOT_ERR_MIN, PLOT_ERR_MAX);
  const a = rng()*6.283, d = rng()*err;
  return { x: x+Math.cos(a)*d, y: y+Math.sin(a)*d, err, stale:false, age:0 };
}

/* Plot acoustique sur une batterie adverse : grossier d'abord, affiné à chaque tir depuis la même position. */
export function soundPlot(plot, x, y, rng){
  const prev = plot && Math.hypot(plot.src.x-x, plot.src.y-y) < SOUND_SAME_POS ? plot : null;
  const err = prev ? Math.max(SOUND_ERR_MIN, prev.err-SOUND_ERR_IMPROVE) : SOUND_ERR_INIT;
  const a = rng()*6.283, d = rng()*err*SOUND_SCATTER;
  return { x: x+Math.cos(a)*d, y: y+Math.sin(a)*d, err, src:{ x, y } };
}
