/* Panneaux latéraux : lecture de tir, roster, munitions, bouton d'exécution. Sortie DOM seulement. */
import { CELL, COLS, ROWS, MPP, MAXRANGE, TER, AMMO, ORDER } from '../config.js';
import { ei, clamp } from '../rules/grid.js';
import { blockReason } from '../rules/orders.js';
import { S, selUnit } from '../state/state.js';
import { bakeReach } from './bake.js';

const $ = id => document.getElementById(id);

export function orderLabel(u){
  if (!u.order) return 'aucun ordre';
  if (u.order.type === 'hold') return 'silence';
  if (u.order.type === 'move') return 'mouvement';
  return 'tir · ' + AMMO[u.order.ammo].name.toLowerCase();
}

export function refreshRead(){
  const u = selUnit();
  const t = (u && u.order && u.order.type === 'fire') ? u.order.aim : (S.mouse.x >= 0 ? S.mouse : null);
  if (u && u !== S.fo && t && S.phase === 'plan'){
    const d = Math.round(Math.hypot(u.x-t.x, u.y-t.y)*MPP/10)*10;
    let ang = Math.atan2(t.y-u.y, t.x-u.x) + Math.PI/2;
    if (ang < 0) ang += 6.283185;
    $('r_dist').textContent = d+' m' + (d > MAXRANGE*MPP ? ' (hors portée)' : '');
    $('r_az').textContent = Math.round(ang/6.283185*6400/10)*10+' mil';
  } else { $('r_dist').textContent='—'; $('r_az').textContent='—'; }
  const m = (S.mouse.x >= 0) ? S.mouse : t;
  if (m){
    const k = S.ter[ei(clamp(Math.floor(m.x/CELL),0,COLS-1), clamp(Math.floor(m.y/CELL),0,ROWS-1))];
    $('r_ter').textContent = TER[k].n;
  } else $('r_ter').textContent = '—';
}

export function refresh(){
  bakeReach();
  $('turnlbl').textContent = 'tour ' + S.turn;
  $('r_left').textContent = S.enemies.filter(e => e.alive).length;

  S.guns.forEach((g, i) => {
    const b = $('u_'+i); if (!b) return;
    b.classList.toggle('sel', S.sel === i);
    b.classList.toggle('dead', !g.alive);
    b.disabled = !g.alive || S.phase !== 'plan';
    const plotted = g.ePlot && !g.ePlot.stale;
    const acc = plotted ? ' — plottée à ' + Math.round(g.ePlot.err*MPP/10)*10 + ' m' : '';
    b.innerHTML = '<div class="top"><span>Pièce '+g.id+'</span>'+
      '<span class="hp">'+'•'.repeat(Math.max(0,g.hp))+'·'.repeat(Math.max(0,2-g.hp))+'</span></div>'+
      '<div class="ord'+(plotted?' plotted':'')+'">'+(g.alive ? orderLabel(g) + acc : 'hors de combat')+'</div>';
  });
  const bf = $('u_fo');
  if (bf){
    bf.classList.toggle('sel', S.sel === 'fo');
    bf.disabled = S.phase !== 'plan';
    bf.innerHTML = '<div class="top"><span>Observateur</span><span class="hp">4</span></div>'+
      '<div class="ord">'+orderLabel(S.fo)+'</div>';
  }

  const u = selUnit();
  $('selname').textContent = u ? (u === S.fo ? 'observateur' : 'pièce ' + u.id) : '—';
  $('r_sig').textContent = (u && u !== S.fo)
    ? u.sig.toFixed(1).replace('.0','') + (u.ePlot && !u.ePlot.stale ? ' — repérée' : '')
    : '—';
  if (u && u !== S.fo && u.lastAim && u.lastImpact){
    const dx = Math.round((u.lastImpact.x-u.lastAim.x)*MPP/10)*10;
    const dy = Math.round((u.lastImpact.y-u.lastAim.y)*MPP/10)*10;
    $('r_err').textContent = (dx>=0?'+':'')+dx+' / '+(dy>=0?'+':'')+dy+' m';
  } else $('r_err').textContent = '—';

  $('o_fire').classList.toggle('sel', S.otype === 'fire');
  $('o_move').classList.toggle('sel', S.otype === 'move');
  $('o_hold').classList.toggle('sel', S.otype === 'hold');
  $('o_fire').disabled = S.phase !== 'plan' || u === S.fo;
  $('o_move').disabled = S.phase !== 'plan';
  $('o_hold').disabled = S.phase !== 'plan';

  for (const id of ORDER){
    const b = $('a_'+id); if (!b) continue;
    b.classList.toggle('sel', id === S.ammo && S.otype === 'fire' && u !== S.fo);
    b.classList.toggle('out', S.stock[id] <= 0);
    b.querySelector('.s').textContent = S.stock[id] === Infinity ? '∞' : S.stock[id];
    b.disabled = S.phase !== 'plan' || u === S.fo;
  }
  const why = S.phase === 'plan' ? blockReason(S.guns, S.stock, S.vis, S.drones) : '';
  $('gomsg').textContent = why;
  $('go').disabled = S.phase !== 'plan' || !!why;
  refreshRead();
}
