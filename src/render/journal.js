/* Journal de bord : la trace textuelle des tours, écrite dans le DOM. */
import { S } from '../state/state.js';

const $ = id => document.getElementById(id);

export function log(txt, cls){
  const d = document.createElement('div');
  d.innerHTML = '<span class="n">'+String(S.turn).padStart(2,'0')+'</span><span class="'+(cls||'')+'">'+txt+'</span>';
  $('log').appendChild(d); $('log').scrollTop = $('log').scrollHeight;
}
export function sep(txt){
  const d = document.createElement('div'); d.className='sep'; d.textContent = txt;
  $('log').appendChild(d); $('log').scrollTop = $('log').scrollHeight;
}
export function clearJournal(){ $('log').innerHTML = ''; }
