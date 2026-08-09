/* Entrées : souris, clavier, boutons. Les gestes deviennent des ordres ou des changements de sélection. */
import { W, H, CELL, COLS, ROWS, AMMO, ORDER } from '../config.js';
import { ei, clamp } from '../rules/grid.js';
import { pathTo } from '../rules/reach.js';
import { S, selUnit, budgetOf } from '../state/state.js';
import { cv } from '../render/draw.js';
import { refresh, refreshRead } from '../render/hud.js';

const $ = id => document.getElementById(id);

/* callbacks fournis par main pour ne pas dépendre de loop/ */
let onExecute = () => {}, onReset = () => {};

function toMap(ev){
  const r = cv.getBoundingClientRect();
  return { x:(ev.clientX-r.left)*(W/r.width), y:(ev.clientY-r.top)*(H/r.height) };
}

export function selectUnit(i){
  S.sel = i;
  const u = selUnit();
  if (u === S.fo && S.otype === 'fire') S.otype = 'move';
  if (u && u.order) S.otype = u.order.type;
  refresh();
}

export function setOrderType(t){
  const u = selUnit(); if (!u) return;
  if (u === S.fo && t === 'fire') return;
  S.otype = t;
  if (t === 'hold') u.order = { type:'hold' };
  else if (u.order && u.order.type !== t) u.order = null;
  refresh();
}

export function buildAmmo(){
  const box = $('ammolist'); box.innerHTML = '';
  for (const id of ORDER){
    const A = AMMO[id], b = document.createElement('button');
    b.id = 'a_'+id;
    b.innerHTML = '<div class="top"><span>'+A.name+'</span><span class="k">'+A.key+' · <span class="s"></span></span></div>'+
      '<div class="d">'+A.desc+'</div>';
    b.onclick = () => {
      if (selUnit() === S.fo) return;
      S.ammo = id; S.otype = 'fire';
      const u = selUnit();
      if (u && u.order && u.order.type === 'fire') u.order.ammo = id;
      refresh();
    };
    box.appendChild(b);
  }
}

export function buildRoster(){
  const box = $('roster'); box.innerHTML = '';
  S.guns.forEach((g, i) => {
    const b = document.createElement('button');
    b.id = 'u_'+i; b.onclick = () => selectUnit(i);
    box.appendChild(b);
  });
  const b = document.createElement('button');
  b.id = 'u_fo'; b.onclick = () => selectUnit('fo');
  box.appendChild(b);
}

export function initInput({ execute, reset }){
  onExecute = execute; onReset = reset;

  cv.addEventListener('mousemove', e => { S.mouse = toMap(e); refreshRead(); });
  cv.addEventListener('click', e => {
    if (S.phase !== 'plan') return;
    const p = toMap(e);
    // sélection directe d'une unité amie
    for (let i = 0; i < S.guns.length; i++){
      if (S.guns[i].alive && Math.hypot(p.x-S.guns[i].x, p.y-S.guns[i].y) < 18){ selectUnit(i); return; }
    }
    if (Math.hypot(p.x-S.fo.x, p.y-S.fo.y) < 18){ selectUnit('fo'); return; }

    const u = selUnit(); if (!u) return;
    if (S.otype === 'fire' && u !== S.fo) u.order = { type:'fire', ammo:S.ammo, aim:p };
    else if (S.otype === 'move'){
      const i = ei(clamp(Math.floor(p.x/CELL),0,COLS-1), clamp(Math.floor(p.y/CELL),0,ROWS-1));
      if (S.uiDist[i] <= budgetOf(u))
        u.order = { type:'move', dest:p, path: pathTo(u.x, u.y, p.x, p.y, S.uiPrev) };
    }
    refresh();
  });

  $('o_fire').onclick = () => setOrderType('fire');
  $('o_move').onclick = () => setOrderType('move');
  $('o_hold').onclick = () => setOrderType('hold');
  $('go').onclick = onExecute;

  window.addEventListener('keydown', e => {
    if (e.key === 'n' || e.key === 'N'){ onReset(); return; }
    if (S.phase !== 'plan') return;
    const k = e.key.toLowerCase();
    if (k === '1' || k === '2' || k === '3'){ const i = +k-1; if (S.guns[i] && S.guns[i].alive) selectUnit(i); }
    else if (k === '4') selectUnit('fo');
    else if (k === 'f') setOrderType('fire');
    else if (k === 'm') setOrderType('move');
    else if (k === 's') setOrderType('hold');
    else if (k === ' '){ onExecute(); e.preventDefault(); }
    else {
      const f = ORDER.find(id => AMMO[id].key.toLowerCase() === k);
      if (f && selUnit() !== S.fo){
        S.ammo = f; S.otype = 'fire';
        const u = selUnit();
        if (u && u.order && u.order.type === 'fire') u.order.ammo = f;
        refresh();
      }
    }
  });
}
