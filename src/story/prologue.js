// PROLOGUE (ported from the single-file build)
import '../ui/character-sheet.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { CLASSES } from '../data/constants.js';
import { $, Bus, LH, LW, S, clamp, ri } from '../core/state.js';
import { flash, log } from '../ui/log.js';
import { Au } from '../audio/audio.js';
import { camera, resize, snapCamera } from '../render/world.js';
import { markSeen } from '../game/exploration.js';
import { esc } from '../ui/panels.js';
import { PORTRAITS } from '../ui/hud.js';
import { chapterCheck, story } from './saga.js';

export const intro={active:false,t0:0,fired:0,timers:[]};
const N3=(a,b,e)=>[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e];
export const easeIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const SHOTS=[
 {a:0,b:5.8,time:12*60+20,ecl:true,p:[[20,1.2,7],[20,2.2,9]],l:[[20,16,38],[20,21,36]]},
 {a:5.8,b:11.2,time:[17*60,17*60+45],orbit:[-2.6,-.8,17,12,8.5]},
 {a:11.2,b:17,time:22*60+30,p:[[15,7,14],[21.6,3.4,18.6]],l:[[23.5,0,20.5],[23.5,0,20.6]]},
 {a:17,b:22.2,time:[4*60+50,9*60],p:[[18,1.4,7.5],[17,8,9]],l:[[23,.3,3.2],[20,0,5]]},
 {a:22.2,b:27.4,time:8*60,p:[[5,8,13],[1.5,1,13.9]],l:[[1.5,0,10],[1.5,.8,6]]},
 {a:27.4,b:31.6,time:8*60,p:[[1.5,1,13.9],[1.5,.5,13.5]],l:[[1.5,.8,6],[1.5,.5,5]]}
];
const INTRO_END=31.6;
const HZ={D3:146.8,F3:174.6,A3:220,Bb2:116.5,D4:293.7,G2:98,Bb3:233.1,F4:349.2,C4:261.6,A4:440,C3:130.8,E3:164.8,G3:196,Fs3:185,E4:329.6};
export const chord=(ns,d)=>Au.pad(ns.map(n=>HZ[n]),d);
function caption(eye,text){const c=$('#iCap');c.classList.remove('out');const e=$('#iEye');e.textContent=eye;e.classList.remove('in');void e.offsetWidth;e.classList.add('in');
  $('#iLine').innerHTML=text.split(' ').map((w,i)=>`<span class="w" style="animation-delay:${.25+i*.075}s">${esc(w)}</span>`).join(' ');}
const capOut=()=>$('#iCap').classList.add('out');
const CUES=[
 {t:.2,f:()=>{$('#intro').classList.add('on');caption('I · The Two Lights','Once, the sun and the moon wore a single crown.');chord(['D3','F3','A3','D4'],6.4);}},
 {t:5.1,f:capOut},
 {t:5.9,f:()=>{caption('II · Hollowmere','Its light held the town of Hollowmere in balance, from dawn to dusk to dawn.');chord(['Bb2','D3','F3','Bb3'],6);}},
 {t:10.6,f:capOut},
 {t:11.3,f:()=>{caption('III · The Theft','Then the Umbral Regent stole the Eclipse Crown and fled below, into the Moonspire.');chord(['G2','Bb2','D3','G3'],6.4);flash('#6a3cff');Au.tone(73,2.4,'sawtooth',.03,49);}},
 {t:16.3,f:capOut},
 {t:17.1,f:()=>{caption('IV · The Divided Sky','Now the sun rules the day and the moon rules the night, and neither will yield.');chord(['F3','A3','C4','F4'],6);}},
 {t:21.7,f:capOut},
 {t:22.4,f:()=>{caption('V · The Call','Four heroes answer.');chord(['C3','E3','G3','C4'],6);[...$('#iHeroes').children].forEach((h,i)=>intro.timers.push(setTimeout(()=>h.classList.add('in'),500+i*380)));}},
 {t:26.9,f:()=>{capOut();[...$('#iHeroes').children].forEach(h=>h.classList.remove('in'));}},
 {t:27.5,f:()=>{$('#iTitle').classList.add('in');chord(['D3','Fs3','A3','D4'],5.5);[587.3,880,1174.7].forEach((f,i)=>Au.tone(f,2.2,'sine',.05,null,.2+i*.35));}}
];
export function playIntro(){
  intro.active=true;intro.t0=performance.now();intro.fired=0;intro.timers=[];
  const blurb={knight:'Shield of the party',ranger:'Never misses',cleric:'Strongest by day',sorc:'Strongest by night'};
  $('#iHeroes').innerHTML=S.party.map(p=>`<div class="hero"><img alt="" src="${PORTRAITS[p.cls]}"><b>${esc(p.name.split(' ').pop())}</b><span>${CLASSES[p.cls].title}</span><em>${blurb[p.cls]}</em></div>`).join('');
  ['#iTitle','#iCap'].forEach(q=>$(q).classList.remove('in','out'));$('#iLine').innerHTML='';$('#iEye').textContent='';
  const I=$('#intro');I.classList.remove('on','fade');I.hidden=false;document.body.classList.add('cine');
  requestAnimationFrame(resize);
}
export function updateIntro(now){
  const t=(now-intro.t0)/1000;
  while(intro.fired<CUES.length&&t>=CUES[intro.fired].t){CUES[intro.fired].f();intro.fired++;}
  const sh=SHOTS.find(x=>t>=x.a&&t<x.b)||SHOTS[SHOTS.length-1];const k=clamp((t-sh.a)/(sh.b-sh.a),0,1),e=easeIO(k);
  S.time=Array.isArray(sh.time)?sh.time[0]+(sh.time[1]-sh.time[0])*k:sh.time;
  S.flags.riteUntil=sh.ecl?S.time+60:-1;
  if(sh.orbit){const [a0,a1,r,h0,h1]=sh.orbit;const ang=a0+(a1-a0)*e;const cx=LW()/2,cz=LH()/2;camera.position.set(cx+Math.cos(ang)*r,h0+(h1-h0)*e,cz+Math.sin(ang)*r);camera.lookAt(cx,0,cz);}
  else{const p=N3(sh.p[0],sh.p[1],e),q=N3(sh.l[0],sh.l[1],e);camera.position.set(p[0],p[1],p[2]);camera.lookAt(q[0],q[1],q[2]);}
  if(t>=INTRO_END)endIntro();
}
export function endIntro(){
  if(!intro.active)return;S.weather={t:'clear',until:8*60+ri(150,300)};intro.active=false;intro.timers.forEach(clearTimeout);
  S.time=8*60;S.flags.riteUntil=-1;
  const I=$('#intro');I.classList.add('fade');setTimeout(()=>{I.hidden=true;I.classList.remove('on','fade');},700);
  document.body.classList.remove('cine');snapCamera();markSeen();requestAnimationFrame(resize);
  setTimeout(()=>{if(S&&!intro.active){chapterCheck();story('arrive');}},760);
  log('Brother Oren: "The Regent hides in the Moonspire, beneath the Barrow Catacombs. We start here, in Hollowmere."');
  log('Tip: gear up at the outfitters (north-east) and visit the temple and guild before you descend.','dim');
  Bus.emit('hud');
}
$('#skipIntro').addEventListener('click',endIntro);
