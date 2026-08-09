/* Synthèse Web Audio : détonations, départs, bip drone. Tout est procédural. */
import { S } from './state/state.js';

let ac = null, nb = null;
function actx(){ if (!ac) ac = new (window.AudioContext||window.webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume(); return ac; }
function nbuf(a){ if (!nb){ nb = a.createBuffer(1, a.sampleRate*1.2, a.sampleRate);
  const d = nb.getChannelData(0); for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1; } return nb; }

export function boom(power, muffled){
  // une salve de bombelettes declenche sept detonations en une demi-seconde :
  // au-dela de deux, on n'entend pas la difference et chaque son coute une dizaine de noeuds
  if (S.fnum - S.boomAt < 8){ if (S.boomCount >= 2) return; S.boomCount++; }
  else { S.boomAt = S.fnum; S.boomCount = 1; }
  try {
    const a = actx(), t = a.currentTime, v = power*(muffled?.35:1);
    const o = a.createOscillator(); o.type='sine';
    o.frequency.setValueAtTime(muffled?90:160, t);
    o.frequency.exponentialRampToValueAtTime(26, t+.6);
    const g = a.createGain(); g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.02,.8*v), t+.012);
    g.gain.exponentialRampToValueAtTime(.0001, t+1);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t+1.05);
    const s = a.createBufferSource(); s.buffer = nbuf(a);
    const lp = a.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.setValueAtTime(muffled?320:1800, t);
    lp.frequency.exponentialRampToValueAtTime(140, t+.7);
    const g2 = a.createGain(); g2.gain.setValueAtTime(Math.max(.02,.5*v), t);
    g2.gain.exponentialRampToValueAtTime(.0001, t+.85);
    s.connect(lp).connect(g2).connect(a.destination); s.start(t); s.stop(t+1);
    const cr = a.createBufferSource(); cr.buffer = nbuf(a);
    const hp = a.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = muffled?260:1300;
    const g3 = a.createGain();
    g3.gain.setValueAtTime(Math.max(.01,(muffled?.07:.38)*power), t);
    g3.gain.exponentialRampToValueAtTime(.0001, t+.1);
    cr.connect(hp).connect(g3).connect(a.destination); cr.start(t); cr.stop(t+.14);
  } catch(e){}
}

export function muzzle(far){
  try {
    const a = actx(), t = a.currentTime, v = far?.16:.3;
    const s = a.createBufferSource(); s.buffer = nbuf(a);
    const bp = a.createBiquadFilter(); bp.type='bandpass';
    bp.frequency.value = far?420:850; bp.Q.value=.7;
    const g = a.createGain(); g.gain.setValueAtTime(v,t);
    g.gain.exponentialRampToValueAtTime(.0001, t+.3);
    s.connect(bp).connect(g).connect(a.destination); s.start(t); s.stop(t+.35);
    const o = a.createOscillator(); o.type='triangle';
    o.frequency.setValueAtTime(far?120:170, t);
    o.frequency.exponentialRampToValueAtTime(45, t+.22);
    const g2 = a.createGain(); g2.gain.setValueAtTime(v,t);
    g2.gain.exponentialRampToValueAtTime(.0001, t+.3);
    o.connect(g2).connect(a.destination); o.start(t); o.stop(t+.35);
  } catch(e){}
}

export function beep(){
  try { const a = actx(), t = a.currentTime;
    const o = a.createOscillator(); o.type='square'; o.frequency.value=660;
    const g = a.createGain(); g.gain.setValueAtTime(.06,t);
    g.gain.exponentialRampToValueAtTime(.0001, t+.18);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t+.2);
  } catch(e){}
}
