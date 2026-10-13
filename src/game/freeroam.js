// FREE ROAM: an optional first-person mode with smooth movement and mouse look.
// The world stays a grid underneath. Crossing into a new tile runs the same step
// rules as a grid move (time, encounters, shops, stairs), so nothing in the story
// or combat needs to know which mode is on.
import { $, Bus, FR, S, clamp, ui } from '../core/state.js';
import { MV, anim, camera, renderer, setYaw, snapCamera, yaw } from '../render/world.js';
import { canAct, enterTile, markSeen, passable, tryEnter } from './exploration.js';
import { sheet } from '../ui/character-sheet.js';
import { log } from '../ui/log.js';

const PREF='ec-freeroam';
const R=.2;                 // body radius in tiles: keeps the near plane out of walls
const WALK=2.6,RUN=4.2;     // tiles per second (Shift runs)
const TURN=2.4;             // radians per second for arrow keys and the touch pad
const SENS=.0022;           // mouse look, radians per pixel
const PITCH=1.2;
const FINE=matchMedia('(pointer:fine)').matches;

let lastMode='explore',bumpT=0;

export function freeRoamOn(){try{return localStorage.getItem(PREF)==='1';}catch{return false;}}

export function setFreeRoam(on){
  FR.on=on;try{localStorage.setItem(PREF,on?'1':'0');}catch{}
  MV.held.clear();
  if(!on){if(document.pointerLockElement)document.exitPointerLock();if(S&&S.mode==='explore'&&!anim.active)snapCamera();}
  document.body.classList.toggle('free-roam',on);
  const b=$('#bRoam');if(b){b.textContent='Free roam: '+(on?'on':'off');b.setAttribute('aria-pressed',String(on));}
  const v=$('#vRoam');if(v)v.setAttribute('aria-pressed',String(on));
  if(S)log(on?(FINE?'Free roam: WASD to move, click the view to look with the mouse, Esc to release it.':'Free roam: drag the view to look, use the pad to move.'):'Free roam off: back to stepping tile by tile.','dim');
}
export function toggleFreeRoam(){setFreeRoam(!FR.on);}

/** Movement may only happen while play is free and no shop or chat panel is waiting on a choice. */
const canRoam=()=>FR.on&&canAct();

// ---- looking ----
function look(dx,dy){if(!canRoam())return;setYaw(yaw-dx*SENS);FR.pitch=clamp(FR.pitch-dy*SENS,-PITCH,PITCH);syncDir();}
document.addEventListener('mousemove',e=>{if(renderer&&document.pointerLockElement===renderer.domElement)look(e.movementX,e.movementY);});
/** Click on the 3D view captures the mouse for looking (desktop only). */
export function captureMouse(){if(!FR.on||!FINE||!renderer||!canRoam()||document.pointerLockElement)return false;
  const p=renderer.domElement.requestPointerLock();if(p&&p.catch)p.catch(()=>{});return true;}
// touch: drag anywhere on the view to look around
let drag=null;
export function bindTouchLook(el){
  el.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||!FR.on)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};});
  el.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;look((e.clientX-drag.x)*1.6,(e.clientY-drag.y)*1.6);drag.x=e.clientX;drag.y=e.clientY;});
  ['pointerup','pointercancel','pointerleave'].forEach(t=>el.addEventListener(t,e=>{if(drag&&e.pointerId===drag.id)drag=null;}));
}

// ---- moving ----
/** The grid facing follows the camera, so the compass, map cone and fights face where you look. */
function syncDir(){const d=((Math.round(-yaw/(Math.PI/2))%4)+4)%4;if(d!==S.dir){S.dir=d;markSeen();Bus.emit('hud');}}
/** True when a body of radius R centred at (x,z) overlaps only walkable tiles. */
function fits(x,z){
  for(let ty=Math.floor(z-R);ty<=Math.floor(z+R);ty++)for(let tx=Math.floor(x-R);tx<=Math.floor(x+R);tx++){
    if(tx===S.x&&ty===S.y)continue;if(!passable(tx,ty))return false;}
  return true;}
/** The tile the body pushes into when blocked, for door and gate messages. */
function touch(x,z){const tx=Math.floor(x),ty=Math.floor(z);if(tx===S.x&&ty===S.y)return;
  const now=performance.now();if(now-bumpT<1500)return;bumpT=now;tryEnter(tx,ty);}

export function updateFreeRoam(now,dt){
  if(!S)return;
  // A fight (or anything else) taking over play: face the grid square-on so the battle lines up.
  if(lastMode==='explore'&&S.mode!=='explore'&&FR.on)snapCamera();
  lastMode=S.mode;
  const free=canRoam();
  if(document.pointerLockElement&&(!free||ui.menu||sheet.i!=null))document.exitPointerLock();
  if(!free){FR.spd=0;return;}
  const h=MV.held;
  const turn=(h.has('arrowright')?1:0)-(h.has('arrowleft')?1:0);
  if(turn){setYaw(yaw-turn*TURN*dt);syncDir();}
  const f=(h.has('w')||h.has('arrowup')?1:0)-(h.has('s')||h.has('arrowdown')?1:0);
  const r=(h.has('d')||h.has('e')?1:0)-(h.has('a')||h.has('q')?1:0);
  const len=Math.hypot(f,r);
  const tgt=len?(h.has('shift')?RUN:WALK)*(f<0&&!r?.7:1):0;
  FR.spd+=(tgt-FR.spd)*(1-Math.exp(-dt*(tgt>FR.spd?9:14)));
  if(FR.spd<.01){FR.spd=0;return;}
  if(!len)return; // coasting to a stop keeps the head-bob settling, no drift
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
  const step=FR.spd*dt/len;
  const mx=(fx*f+rx*r)*step,mz=(fz*f+rz*r)*step;
  const p=camera.position;
  // slide along walls: try each axis on its own
  if(fits(p.x+mx,p.z))p.x+=mx;else touch(p.x+mx+Math.sign(mx)*R,p.z);
  if(fits(p.x,p.z+mz))p.z+=mz;else touch(p.x,p.z+mz+Math.sign(mz)*R);
  const tx=Math.floor(p.x),ty=Math.floor(p.z);
  if(tx!==S.x||ty!==S.y){syncDir();enterTile(tx,ty);}
}
