// SAVE / OVERLAYS (ported from the single-file build)
import '../ui/hud.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { LEVELS } from '../data/constants.js';
import { LEGACY_SAVE_KEY, SAVE_KEY, decodeSave, encodeSave } from './save-format';
import { $, Bus, C, S, dayOf, ensureHero, newState, setC, setS } from './state.js';
import { banner, log } from '../ui/log.js';
import { Au } from '../audio/audio.js';
import { buildLevel, snapCamera } from '../render/world.js';
import { closeMenus, markSeen } from '../game/exploration.js';
import { endCombat } from '../game/combat.js';
import { B } from '../ui/panels.js';
import { playIntro } from '../story/prologue.js';
import { sagaReset, story } from '../story/saga.js';

export function save(quiet){try{localStorage.setItem(SAVE_KEY,encodeSave(S));if(!quiet){log('Game saved.','dim');banner('Saved');}}catch(e){if(!quiet)log('Saving is unavailable in this browser window.','bad');}}
function loadSave(){
  let raw=null;try{raw=localStorage.getItem(SAVE_KEY)??localStorage.getItem(LEGACY_SAVE_KEY);}catch(e){return null;}
  const res=decodeSave(raw,LEVELS);
  if(!res.ok){if(res.reason!=='empty')console.warn('Save not loaded:',res.reason);return null;}
  res.notes.forEach(n=>console.info('Save:',n));
  return res.state;
}
export function beginWith(state,fresh){
  sagaReset();setS(state);S.party.forEach(ensureHero);S.mode='explore';setC(null);endCombat();closeMenus();$('#party').innerHTML='';$('#log').innerHTML='';
  buildLevel();snapCamera();markSeen();$('#overlay').hidden=true;
  if(fresh)playIntro();
  else log('The chronicle resumes.','dim');
  Bus.emit('hud');
}
export function showOverlay(kind){
  const o=$('#overlay');const has=!!loadSave();let h='';
  if(kind==='title'){
    h=`<div class="ov"><div class="eyebrow">A party role-playing chronicle</div><h1>The Eclipse Crown</h1>
    <p>Four heroes of Hollowmere must descend through the Barrow Catacombs to the Moonspire and take back the crown from the Umbral Regent.</p>
    <p class="muted">Every step turns the sky. Sun magic rules the day and moon magic rules the night. Some gates open only in one of them, and the Regent can only truly be hurt when sun and moon share the sky.</p>
    <div class="btns" style="justify-content:center">${B('ov-new','Begin the chronicle')}${has?B('ov-cont','Continue'):''}</div>
    <div class="ovgrid"><div><b>Explore</b>W S to walk, A D to turn, Q E to sidestep. Or use the pad below the party.</div><div><b>Fight</b>Turn-based. Pick actions and targets in the side panel.</div><div><b>Read the sky</b>The dial shows sun or moon. Plan fights and gates by the hour.</div></div></div>`;
  }else if(kind==='defeat'){
    h=`<div class="ov"><div class="eyebrow">The chronicle falters</div><h1>The Party Has Fallen</h1><p>Darkness closes over the last of your torches.</p><div class="btns" style="justify-content:center">${has?B('ov-cont','Load last save'):''}${B('ov-new','Start over')}</div></div>`;
  }else if(kind==='win'){
    const days=dayOf();
    h=`<div class="ov"><div class="eyebrow">Day ${days} · The chronicle ends</div><h1>The Crown Returns</h1><p>The Regent unravels into dusk and the Eclipse Crown rolls, ringing, across the Moonspire floor. Over Hollowmere the sun and moon part and take their own hours again.</p>
    <p class="muted">${S.party.map(p=>`${p.name} (Lv ${p.lvl})`).join(' · ')}</p><div class="btns" style="justify-content:center">${B('ov-keep','Keep exploring')}${B('ov-new','New chronicle')}</div></div>`;
  }
  o.innerHTML=h;o.hidden=false;
}
export function showEnding(){story('crown',()=>{banner('The Eclipse Crown is yours');showOverlay('win');});}
$('#overlay').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;Au.init();const a=b.dataset.act;
  if(a==='ov-new')beginWith(newState(),true);else if(a==='ov-cont'){const s=loadSave();if(s)beginWith(s,false);}else if(a==='ov-keep'){$('#overlay').hidden=true;}});
