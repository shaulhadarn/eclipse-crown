// LOOP & BOOT (ported from the single-file build)
import './input.js'; // load-order chain: keeps the original top-to-bottom start-up order
import * as THREE from 'three';
import { DIRS } from '../data/constants.js';
import { $, Bus, C, S, newState, rnd, setS } from './state.js';
import { TEX, portrait } from '../render/textures.js';
import { MV, PERF, anim, buildLevel, camera, combatGroup, renderer, resize, scene, setup3D, snapCamera, sun, updateAnim, updateLighting } from '../render/world.js';
import { applyWeather } from '../render/weather.js';
import { markSeen } from '../game/exploration.js';
import { PORTRAITS, PORTRAITS_B, setDock } from '../ui/hud.js';
import { beginWith, showOverlay } from './save.js';
import { sheet } from '../ui/character-sheet.js';
import { intro, updateIntro } from '../story/prologue.js';
import { bindSwipe, onViewClick } from './input.js';
import { bindTouchLook, freeRoamOn, setFreeRoam, updateFreeRoam } from '../game/freeroam.js';

let last=0;
function loop(now){
  requestAnimationFrame(loop);
  if(!S)return;
  const dtw=Math.min(.1,(now-(loop.last||now))/1000);loop.last=now;
  if(intro.active)updateIntro(now);else{updateFreeRoam(now,dtw);updateAnim(now);}updateLighting(now);applyWeather(now,dtw);
  animateFoes(now);updateSparks(dtw);
  if(C){const plates=$('#foes').children;const r=$('#view').getBoundingClientRect();const v=new THREE.Vector3();
    C.enemies.forEach((e,i)=>{const el=plates[i];if(!el||!e.spr)return;v.copy(e.spr.position);v.y+=e.spr.scale.y*.5+.02;v.project(camera);
      el.style.transform=`translate(${((v.x+1)/2*r.width).toFixed(1)}px,${((1-v.y)/2*r.height-4).toFixed(1)}px) translate(-50%,-100%)`;el.classList.toggle('dead',!e.alive);el.querySelector('i').style.width=(e.hp/e.max*100)+'%';});
    $('#foes').classList.toggle('pick',C.step==='target'||C.step==='action');}
  const walking=anim.active||MV.held.size>0;Bus.ready=1;Bus.flush(now,walking);
  const sk=sun.castShadow?Math.round(sun.position.x*4)+','+Math.round(sun.position.y*4)+','+Math.round(sun.position.z*4)+','+S.lvl:'off';
  if(sk!==PERF.sunKey&&(!walking||now-(PERF.shT||0)>3500||sk==='off'||!PERF.sunKey||sk.split(',')[3]!==PERF.sunKey.split(',')[3])){PERF.sunKey=sk;PERF.shT=now;renderer.shadowMap.needsUpdate=true;}
  const ft=now-(PERF.last||now);PERF.last=now;if(ft>0&&ft<250){PERF.acc+=ft;PERF.n++;}
  if(PERF.n>=45&&!walking){const avg=PERF.acc/PERF.n;PERF.acc=PERF.n=0;if(PERF.cool>0)PERF.cool--;else{
    if(avg>21&&PERF.dpr>PERF.min){PERF.dpr=Math.max(PERF.min,PERF.dpr-.15);renderer.setPixelRatio(PERF.dpr);resize();PERF.cool=2;}
    else if(avg<14.5&&PERF.dpr<PERF.cap){PERF.dpr=Math.min(PERF.cap,PERF.dpr+.1);renderer.setPixelRatio(PERF.dpr);resize();PERF.cool=3;}}}
  if(sheet.i!=null&&!$('#sheet').hidden){PERF.skip=(PERF.skip||0)+1;if(PERF.skip%8)return;}
  renderer.render(scene,camera);
}
function animateFoes(now){
  if(!C){return;}const [fx,fz]=DIRS[S.dir];
  for(const s of combatGroup.children){const u=s.userData;if(!s.isSprite||u.base==null)continue;
    if(u.aura){s.material.opacity=.62+Math.sin(now*.004+u.i)*.2;continue;}
    const b=Math.sin(now*.0032+u.ph);let x=u.bx,z=u.bz,y=u.base+b*.012,sx=u.sc*(1-b*.018),sy=u.sc*(1+b*.03);
    s.material.rotation=Math.sin(now*.0019+u.ph)*.035;
    if(u.lt){const t=(now-u.lt)/340;if(t<1){const k=Math.sin(t*Math.PI);x-=fx*k*.3;z-=fz*k*.3;y+=k*.04;sx*=1+k*.12;sy*=1+k*.12;}else u.lt=0;}
    if(u.ht){const t=(now-u.ht)/260;if(t<1){const k=(1-t);x+=(-fz)*Math.sin(t*50)*.035*k;z+=fx*Math.sin(t*50)*.035*k;}else u.ht=0;}
    if(u.dt){const t=Math.min(1,(now-u.dt)/600);s.material.opacity=1-t;s.material.color.setScalar(1-t*.6);sx*=1+t*.25;sy*=1-t*.5;y-=t*.05;}
    s.position.set(x,y,z);s.scale.set(sx,sy,1);}
}
let sparkPts,sparkV,sparkL;
export function setupSparks(){const N=160;sparkV=new Float32Array(N*3);sparkL=new Float32Array(N);const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3).fill(-99),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(N*3),3));
  sparkPts=new THREE.Points(g,new THREE.PointsMaterial({size:.05,map:TEX.glow,vertexColors:true,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,toneMapped:false}));sparkPts.renderOrder=12;sparkPts.frustumCulled=false;scene.add(sparkPts);sparkPts.userData.next=0;}
export function sparks(pos,col,n,spd=1){if(!sparkPts)return;const P=sparkPts.geometry.attributes.position,Cc=sparkPts.geometry.attributes.color,c=new THREE.Color(col);const N=sparkL.length;
  for(let k=0;k<n;k++){const i=sparkPts.userData.next;sparkPts.userData.next=(i+1)%N;P.setXYZ(i,pos.x+rnd(-.08,.08),pos.y+rnd(-.05,.12),pos.z+rnd(-.08,.08));
    sparkV[i*3]=rnd(-1,1)*.9*spd;sparkV[i*3+1]=rnd(.4,1.6)*spd;sparkV[i*3+2]=rnd(-1,1)*.9*spd;sparkL[i]=rnd(.35,.7);Cc.setXYZ(i,c.r,c.g,c.b);}
  P.needsUpdate=Cc.needsUpdate=true;}
function updateSparks(dt){if(!sparkPts)return;const P=sparkPts.geometry.attributes.position,Cc=sparkPts.geometry.attributes.color,a=P.array;let any=false;
  for(let i=0;i<sparkL.length;i++){if(sparkL[i]<=0)continue;any=true;sparkL[i]-=dt;if(sparkL[i]<=0){a[i*3+1]=-99;continue;}
    sparkV[i*3+1]-=dt*3.2;a[i*3]+=sparkV[i*3]*dt;a[i*3+1]+=sparkV[i*3+1]*dt;a[i*3+2]+=sparkV[i*3+2]*dt;const f=1-dt*2.2;Cc.array[i*3]*=f;Cc.array[i*3+1]*=f;Cc.array[i*3+2]*=f;}
  if(any){P.needsUpdate=true;Cc.needsUpdate=true;}}
function start(data){
  ['knight','ranger','cleric','sorc'].forEach(c=>{PORTRAITS[c]=portrait(c);PORTRAITS_B[c]=portrait(c,true);});
  setup3D();
  renderer.domElement.addEventListener('click',onViewClick);bindSwipe(renderer.domElement);bindTouchLook(renderer.domElement);setFreeRoam(freeRoamOn());
  if(data&&data.S){beginWith(data.S,false);}
  else{setS(newState());buildLevel();snapCamera();markSeen();Bus.emit('hud');showOverlay('title');}
  setDock();requestAnimationFrame(loop);
}
export function boot(){start({});}
