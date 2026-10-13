// INPUT (ported from the single-file build)
import '../story/saga.js'; // load-order chain: keeps the original top-to-bottom start-up order
import * as THREE from 'three';
import { $, C, FR, S } from './state.js';
import { captureMouse, toggleFreeRoam } from '../game/freeroam.js';
import { Au } from '../audio/audio.js';
import { MV, camera, combatGroup, renderer } from '../render/world.js';
import { move, turn, waitHour } from '../game/exploration.js';
import { act } from '../ui/panels.js';
import { save } from './save.js';
import { closeSheet, renderSheet, sheet } from '../ui/character-sheet.js';
import { endIntro, intro } from '../story/prologue.js';
import { closeJournal, openJournal, saga, sc, sceneEnd, sceneNext } from '../story/saga.js';

export const KEYMAP={w:()=>move(0),arrowup:()=>move(0),s:()=>move(2),arrowdown:()=>move(2),a:()=>turn(-1),arrowleft:()=>turn(-1),d:()=>turn(1),arrowright:()=>turn(1),q:()=>move(3),e:()=>move(1)};
const FREE_KEYS=['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright','shift'];
window.addEventListener('keydown',e=>{
  if(intro.active){if(['Escape',' ','Enter'].includes(e.key)){e.preventDefault();endIntro();}return;}
  if(saga.on){if(sc.done){if(e.key==='Escape')sceneEnd();else if([' ','Enter','ArrowRight','ArrowUp','w','d'].includes(e.key))sceneNext();}else if($('#chap').onclick)$('#chap').onclick();e.preventDefault();return;}
  if(!$('#journal').hidden){if(e.key==='Escape'||e.key.toLowerCase()==='j')closeJournal();e.preventDefault();return;}
  if(e.key.toLowerCase()==='j'&&$('#overlay').hidden&&sheet.i==null){openJournal();e.preventDefault();return;}
  if(sheet.i!=null){if(e.key==='Escape')closeSheet();else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const n=S.party.length;sheet.i=(sheet.i+(e.key==='ArrowRight'?1:n-1))%n;sheet.pick=null;renderSheet();}e.preventDefault();return;}
  if(e.target.closest&&e.target.closest('input,textarea'))return;
  const k=e.key.toLowerCase();
  if(/^[1-9]$/.test(k)&&$('#overlay').hidden){const ab=[...document.querySelectorAll('#panel .ab:not(:disabled)')];const bs=ab.length?ab:[...document.querySelectorAll('#panel [data-act]:not(:disabled)')];const b=bs[+k-1];if(b){b.click();e.preventDefault();}return;}
  if(k==='f'&&$('#overlay').hidden&&!e.repeat){toggleFreeRoam();e.preventDefault();return;}
  if(FR.on&&FREE_KEYS.includes(k)){MV.held.add(k);e.preventDefault();return;}
  if(KEYMAP[k]){if(!e.repeat){MV.held.delete(k);MV.held.add(k);KEYMAP[k]();}e.preventDefault();}
});
window.addEventListener('keyup',e=>{MV.held.delete(e.key.toLowerCase());});
window.addEventListener('blur',()=>MV.held.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden)MV.held.clear();});
// In free roam the pad's turn buttons turn smoothly (like the arrow keys) instead of strafing.
const padKey=k=>FR.on&&(k==='a'||k==='d')?(k==='a'?'arrowleft':'arrowright'):k;
function bindHold(b){let iv=null,held=null;const go=()=>{Au.init();KEYMAP[b.dataset.k]();};const stop=()=>{clearInterval(iv);iv=null;if(held)MV.held.delete(held);held=null;b.classList.remove('held');};
  b.addEventListener('pointerdown',e=>{e.preventDefault();stop();held=padKey(b.dataset.k);MV.held.add(held);go();b.classList.add('held');});
  ['pointerup','pointerleave','pointercancel','lostpointercapture'].forEach(t=>b.addEventListener(t,stop));
  b.addEventListener('click',e=>{if(e.detail===0)go();});b.addEventListener('contextmenu',e=>e.preventDefault());}
document.querySelectorAll('.dpad button,.vpad button').forEach(bindHold);
// swipe on the 3D view: up = forward, down = back, left/right = turn
let swipe=null;
export function bindSwipe(el){el.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const t=e.touches[0];swipe={x:t.clientX,y:t.clientY};},{passive:true});
  el.addEventListener('touchend',e=>{if(!swipe)return;if(FR.on){swipe=null;return;}const t=e.changedTouches[0];const dx=t.clientX-swipe.x,dy=t.clientY-swipe.y;swipe=null;if(Math.max(Math.abs(dx),Math.abs(dy))<35)return;Au.init();
    if(Math.abs(dx)>Math.abs(dy))turn(dx>0?1:-1);else move(dy<0?0:2);},{passive:true});}
$('#bWait').addEventListener('click',waitHour);
$('#bSave').addEventListener('click',()=>save(false));
function toggleSound(){Au.init();Au.on=!Au.on;$('#bSound').textContent='Sound: '+(Au.on?'on':'off');$('#vSound').textContent=Au.on?'♪':'✕';}
$('#bSound').addEventListener('click',toggleSound);$('#vSound').addEventListener('click',toggleSound);
// tap a foe in the 3D view to target it
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
export function onViewClick(ev){if(!C&&captureMouse())return;if(!C||C.step!=='target')return;const r=renderer.domElement.getBoundingClientRect();mv.set(((ev.clientX-r.left)/r.width)*2-1,-((ev.clientY-r.top)/r.height)*2+1);ray.setFromCamera(mv,camera);const hit=ray.intersectObjects(combatGroup.children.filter(o=>o.isSprite))[0];if(hit){const i=hit.object.userData.i;if(C.enemies[i]&&C.enemies[i].alive)act('tgt',i);}}
$('#bRoam').addEventListener('click',e=>{toggleFreeRoam();e.currentTarget.blur();});$('#vRoam').addEventListener('click',toggleFreeRoam);
