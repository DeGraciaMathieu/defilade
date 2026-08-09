/* Légalité des ordres avant exécution du tour. */
import { AMMO, MAXRANGE } from '../config.js';
import { observed } from './los.js';

export function ammoNeeded(guns){
  const n = {};
  for (const g of guns)
    if (g.alive && g.order && g.order.type === 'fire') n[g.order.ammo] = (n[g.order.ammo]||0) + 1;
  return n;
}

export function blockReason(guns, stock, vis, drones){
  const n = ammoNeeded(guns);
  for (const k in n) if (n[k] > stock[k]) return 'Stock insuffisant : ' + AMMO[k].name.toLowerCase() + '.';
  for (const g of guns){
    if (!g.alive || !g.order || g.order.type !== 'fire') continue;
    const a = g.order.aim;
    if (Math.hypot(a.x-g.x, a.y-g.y) > MAXRANGE) return 'Pièce ' + g.id + ' : objectif hors portée.';
    if (g.order.ammo === 'gui' && !observed(vis, drones, a.x, a.y)) return 'Pièce ' + g.id + ' : guidage sans observation.';
  }
  return '';
}
