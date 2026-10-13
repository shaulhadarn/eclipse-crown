// HUD (ported from the single-file build)
import './panels.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { CLASSES, DIR_NAMES, LEVELS, xpNeed } from '../data/constants.js';
import { $, Bus, C, LH, LW, S, fmtT, hourOf, inMap, isDay, isEclipse, mult, tile, ui } from '../core/state.js';
import { WXT, wxType } from '../render/weather.js';
import { camp, roamActive, roamList, waitHour } from '../game/exploration.js';
import { IC, act, renderPanel } from './panels.js';
import { save } from '../core/save.js';
import { openSheet } from './character-sheet.js';

export const PORTRAITS={},PORTRAITS_B={};
function renderParty(){
  const P=$('#party');
  if(!P.children.length){P.innerHTML=S.party.map((p,i)=>`<button class="card" data-i="${i}" data-cls="${p.cls}"><i class="pdot" hidden></i><span class="pic live" data-cls="${p.cls}"><img alt="" src="${PORTRAITS[p.cls]}"><img class="blk" alt="" src="${PORTRAITS_B[p.cls]}"><span class="fx"></span><span class="lvb"></span></span><div class="meta"><div class="nm"></div><div class="cl"></div><div class="bar hp"><i></i><span></span></div><div class="bar sp"><i></i><span></span></div><div class="bar xp"><i></i></div></div></button>`).join('');}
  S.party.forEach((p,i)=>{const c=P.children[i];c.querySelector('img').src=PORTRAITS[p.cls];c.querySelector('.nm').textContent=MQM.matches?p.name.split(' ').pop():p.name;c.querySelector('.cl').textContent=`${CLASSES[p.cls].title} · Lv ${p.lvl}${p.defending?' · guarding':''}${p.poison?' · poisoned':''}${p.stun?' · webbed':''}`;
    const hp=c.querySelector('.bar.hp');hp.querySelector('i').style.width=(p.hp/p.maxhp*100)+'%';hp.querySelector('span').textContent=`${p.hp}/${p.maxhp}`;
    const sp=c.querySelector('.bar.sp');sp.classList.toggle('none',!p.maxsp);sp.querySelector('i').style.width=p.maxsp?(p.sp/p.maxsp*100)+'%':'0';sp.querySelector('span').textContent=p.maxsp?`${p.sp}/${p.maxsp}`:'no magic';
    c.querySelector('.bar.xp i').style.width=(p.xp/xpNeed(p.lvl)*100)+'%';
    c.querySelector('.pdot').hidden=!(p.ap||p.skp);c.querySelector('.lvb').textContent=p.lvl;
    c.classList.toggle('down',p.hp<=0);c.classList.toggle('turn',!!C&&C.actor===i);c.setAttribute('aria-label',`${p.name}, ${p.hp} of ${p.maxhp} HP`);});
}
$('#party').addEventListener('click',e=>{const c=e.target.closest('.card');if(!c||!S)return;const i=+c.dataset.i;
  if(C&&C.step==='ally'){const b=document.querySelector(`#panel [data-act="ally"][data-arg="${i}"]`);if(b&&!b.disabled)act('ally',i);return;}
  if(ui.dcast){const b=document.querySelector(`#panel [data-act="dtgt"][data-arg="${i}"]`);if(b&&!b.disabled)act('dtgt',i);return;}
  openSheet(i);});

function drawDial(){
  const cv=$('#dial'),g=cv.getContext('2d'),W=cv.width,H=cv.height;g.clearRect(0,0,W,H);
  const cx=W/2,cy=H-10,r=H-24;const day=isDay(),ecl=isEclipse();const h=hourOf();
  g.strokeStyle='#3b3527';g.lineWidth=2;g.beginPath();g.moveTo(8,cy);g.lineTo(W-8,cy);g.stroke();
  g.setLineDash([3,5]);g.strokeStyle=day?'#6b5a36':'#34466e';g.beginPath();g.arc(cx,cy,r,Math.PI,0);g.stroke();g.setLineDash([]);
  const prog=day?(h-6)/12:((h+6)%24)/12;const a=Math.PI+prog*Math.PI;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
  if(ecl){g.save();g.shadowColor='#b48cff';g.shadowBlur=18;g.strokeStyle='#e8c170';g.lineWidth=3;g.beginPath();g.arc(cx,cy-r*.55,15,0,7);g.stroke();g.restore();g.fillStyle='#07060c';g.beginPath();g.arc(cx,cy-r*.55,13,0,7);g.fill();}
  else if(day){g.save();g.shadowColor='#e8c170';g.shadowBlur=16;g.fillStyle='#f0c86a';g.beginPath();g.arc(x,y,11,0,7);g.fill();g.restore();}
  else{g.save();g.shadowColor='#9db6e8';g.shadowBlur=14;g.fillStyle='#d9e3f8';g.beginPath();g.arc(x,y,10,0,7);g.fill();g.restore();g.fillStyle='#151925';g.beginPath();g.arc(x+5,y-3,9,0,7);g.fill();}
  g.fillStyle='#8e94a4';g.font='16px "IBM Plex Mono", monospace';g.textAlign='left';g.fillText('06',6,cy-4);g.textAlign='right';g.fillText('18',W-6,cy-4);
}
function drawMap(){
  const cv=$('#map'),g=cv.getContext('2d'),W=LW(),cs=128/Math.max(W,LH());g.fillStyle='#07080c';g.fillRect(0,0,128,128);const seen=S.seen[S.lvl];
  for(let y=0;y<LH();y++)for(let x=0;x<W;x++){if(!seen[y*W+x])continue;const c=tile(x,y);const px=x*cs,py=y*cs;
    if(c==='#'){g.fillStyle='#4a4230';g.fillRect(px,py,cs,cs);g.fillStyle='#5c5139';g.fillRect(px,py,cs,1);continue;}
    const nat={',':'#1e3320','f':'#2a3a22','m':'#2a4020','c':'#6a5a2a','t':'#14301a','y':'#1c3a1c','u':'#1f3d20','k':'#4a4e54','q':'#6a6e78','h':'#24482a','w':'#1d3f6e','r':'#1d3f6e','b':'#6a4a2a','Y':'#b89a4a','o':'#555a66','g':'#4a4e58'}[c];if(nat){g.fillStyle=nat;g.fillRect(px,py,cs,cs);if(c==='t'||c==='y'){g.fillStyle='#2f6a36';g.beginPath();g.arc(px+cs/2,py+cs/2,cs*.42,0,7);g.fill();}continue;}
    g.fillStyle='#1f2433';g.fillRect(px,py,cs,cs);
    const dot=(col,s=4)=>{g.fillStyle=col;g.fillRect(px+(cs-s)/2,py+(cs-s)/2,s,s);};
    if('<>ISTG='.includes(c))dot('#c9973f',6);else if(c==='E'||c==='B')dot('#d8554a',c==='B'?7:5);else if(c==='M'){g.fillStyle='#9db6e8';g.fillRect(px,py+3,cs,2);}else if(c==='U'){g.fillStyle='#e8c170';g.fillRect(px,py+3,cs,2);}
    else if(c==='C'||c==='1')dot('#e8c170');else if(c==='2')dot('#c7d4f2');else if(c==='F')dot('#6fa8ff');else if(c==='N')dot('#b59a6a',3);else if(c==='A')dot('#a98bf0',6);else if(c==='K'){g.fillStyle='#7a7f8c';g.fillRect(px,py+2,cs,4);}}
  if(roamActive())roamList().forEach(r=>{if(seen[r.y*W+r.x]||Math.abs(r.x-S.x)+Math.abs(r.y-S.y)<=5){g.fillStyle=r.elite?'#ff6a4a':'#d8554a';g.beginPath();g.arc(r.x*cs+cs/2,r.y*cs+cs/2,Math.max(1.6,cs*.38),0,7);g.fill();}});
  g.save();g.translate(S.x*cs+cs/2,S.y*cs+cs/2);g.rotate(S.dir*Math.PI/2);g.fillStyle='#e8c170';g.beginPath();g.moveTo(0,-cs*.6);g.lineTo(cs*.45,cs*.45);g.lineTo(-cs*.45,cs*.45);g.closePath();g.fill();g.restore();
  drawRound();
}
function drawRound(){
  const cv=$('#mapov');if(!cv.offsetWidth)return;const g=cv.getContext('2d'),W=cv.width,c=W/2,cs=18;const seen=S.seen[S.lvl];
  g.clearRect(0,0,W,W);g.save();g.beginPath();g.arc(c,c,c,0,7);g.clip();
  const bg=g.createRadialGradient(c,c,10,c,c,c);bg.addColorStop(0,'#141826');bg.addColorStop(1,'#07080c');g.fillStyle=bg;g.fillRect(0,0,W,W);
  for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=S.x+dx,y=S.y+dy;if(!inMap(x,y)||!seen[y*LW()+x])continue;const t=tile(x,y);const px=c+dx*cs-cs/2,py=c+dy*cs-cs/2;
    const nat={',':'#1e3a22','f':'#2c4024','m':'#2c4622','c':'#7a6a30','t':'#15351c','y':'#20401e','u':'#22442a','k':'#50545a','q':'#72767e','h':'#285a30','w':'#1e4a86','r':'#1e4a86','b':'#7a5530','Y':'#c9a850','o':'#5a606c','g':'#50545e'}[t];if(nat){g.fillStyle=nat;g.fillRect(px,py,cs,cs);if(t==='t'||t==='y'){g.fillStyle='#3a7a40';g.beginPath();g.arc(px+cs/2,py+cs/2,cs*.45,0,7);g.fill();}continue;}
    if(t==='#'){g.fillStyle='#4f4632';g.fillRect(px,py,cs,cs);g.fillStyle='#665a3e';g.fillRect(px,py,cs,2);continue;}
    g.fillStyle='#222839';g.fillRect(px+.5,py+.5,cs-1,cs-1);
    const col='<>ISTG='.includes(t)?'#c9973f':(t==='E'||t==='B')?'#d8554a':t==='M'?'#9db6e8':t==='U'?'#e8c170':(t==='C'||t==='1')?'#e8c170':t==='2'?'#c7d4f2':t==='F'?'#6fa8ff':t==='A'?'#a98bf0':t==='N'?'#b59a6a':t==='K'?'#7a7f8c':null;
    if(col){g.fillStyle=col;if('MUK'.includes(t))g.fillRect(px,py+cs/2-2,cs,4);else{g.beginPath();g.arc(px+cs/2,py+cs/2,t==='B'?6:4,0,7);g.fill();}}}
  if(roamActive())roamList().forEach(r=>{const dx=r.x-S.x,dy=r.y-S.y;if(Math.abs(dx)>6||Math.abs(dy)>6)return;if(!seen[r.y*LW()+r.x]&&Math.abs(dx)+Math.abs(dy)>5)return;g.fillStyle=r.elite?'#ff6a4a':'#e0584a';g.shadowColor='#ff4a2a';g.shadowBlur=8;g.beginPath();g.arc(c+dx*cs,c+dy*cs,5,0,7);g.fill();g.shadowBlur=0;});
  g.save();g.translate(c,c);g.rotate(S.dir*Math.PI/2);g.fillStyle='#f3d38a';g.shadowColor='#e8c170';g.shadowBlur=10;g.beginPath();g.moveTo(0,-9);g.lineTo(7,7);g.lineTo(0,3);g.lineTo(-7,7);g.closePath();g.fill();g.restore();
  g.restore();g.fillStyle='#0c0e14';g.beginPath();g.arc(c,15,13,0,7);g.fill();g.strokeStyle='#c9973f99';g.lineWidth=1.5;g.stroke();g.fillStyle='#e8c170';g.font='bold 20px "IM Fell English SC",Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('N',c,16);
}
const setHTML=(el,h)=>{if(el._h!==h){el._h=h;el.innerHTML=h;}};
const MQM=matchMedia('(max-width:760px)');
function renderHUD(){
  if(!S)return;
  $('#clockTime').textContent=fmtT();
  const st=$('#clockState');const ecl=isEclipse();st.className=ecl?'ecl':isDay()?'sun':'moon';
  if(MQM.matches)st.textContent=ecl?'Eclipse ×2':isDay()?`☀ Sun ×${mult('sun')}`:`☾ Moon ×${mult('moon')}`;else st.textContent=ecl?(S.time<S.flags.riteUntil?'Kindled eclipse · magic ×2 · the ward is broken':'Eclipse · magic ×2 · the ward is broken'):isDay()?`Sun ascendant · sun magic ×${mult('sun')}`:`Moon ascendant · moon magic ×${mult('moon')}`;
  if(S.weather){const t=wxType();if(t!=='under'&&t!=='clear')st.textContent+=' · '+WXT[t].icon+' '+WXT[t].name;}
  $('#gold').textContent=S.gold;$('#pots').textContent=S.potions;$('#eths').textContent=S.ethers;
  $('#sigSun').classList.toggle('on',S.flags.sun);$('#sigMoon').classList.toggle('on',S.flags.moon);
  const L=LEVELS[S.lvl];setHTML($('#place'),`<small>${L.sub}</small>${L.name}`);$('#mapName').textContent=L.name;$('#mapPos').textContent=`X ${S.x} · Y ${S.y} · facing ${DIR_NAMES[S.dir]}`;$('#compass').innerHTML=`<span>${DIR_NAMES[(S.dir+3)%4]}</span><b>${DIR_NAMES[S.dir]}</b><span>${DIR_NAMES[(S.dir+1)%4]}</span>`;$('#hub').textContent=DIR_NAMES[S.dir];
  drawDial();drawMap();renderParty();renderPanel();
  $('#bWait').disabled=S.mode!=='explore';
  document.body.classList.toggle('in-combat',S.mode==='combat');
  const need=S.mode==='combat'||!!ui.menu||ui.detail!=null||!!ui.dcast;if(need&&!dock.prev){dock.min=false;dock.tab='panel';setDock();}else if(!need&&dock.prev&&dock.tab==='panel'){dock.tab='move';setDock();}dock.prev=need;renderMoveInfo();
}
Bus.on('hud',renderHUD);
function renderMoveInfo(){const L=LEVELS[S.lvl];const q=!S.flags.sun||!S.flags.moon?'Seek the sigils in the Barrow Catacombs.':S.flags.crown?'The crown is won.':'Descend to the Moonspire. Break the Regent.';
  const sky=isEclipse()?'Eclipse overhead: all magic ×2.':isDay()?'Daylight: sun magic ×1.5.':'Night: moon magic ×1.5, more foes.';
  setHTML($('#moveinfo'),`<div class="mi-h">${L.name}</div><div class="mi-t">${sky} ${q}</div><div class="mi-b"><button class="mini" data-q="wait">${IC('glass')}Wait</button>${!L.outdoor?`<button class="mini" data-q="camp">${IC('tent')}Camp</button>`:''}<button class="mini" data-q="save">${IC('save')}Save</button></div>`);}
$('#moveinfo').addEventListener('click',e=>{const b=e.target.closest('[data-q]');if(!b)return;({wait:waitHour,camp:camp,save:()=>save(false)})[b.dataset.q]();});
const dock={tab:'move',min:false,prev:false};
export function setDock(){const b=document.body;b.classList.toggle('tab-log',dock.tab==='log');b.classList.toggle('tab-move',dock.tab==='move');b.classList.toggle('dock-min',dock.min);
  document.querySelectorAll('.docktabs [data-tab]').forEach(x=>{if(x.dataset.tab!=='min')x.classList.toggle('on',x.dataset.tab===dock.tab&&!dock.min);});
  $('#dockMin').textContent=dock.min?'▴':'▾';$('#dockMin').setAttribute('aria-label',dock.min?'Show panel':'Hide panel');
  if(dock.tab==='log'&&!dock.min)$('#logDot').hidden=true;}
document.querySelector('.docktabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;const t=b.dataset.tab;
  if(t==='min')dock.min=!dock.min;else if(t===dock.tab&&!dock.min)dock.min=true;else{dock.tab=t;dock.min=false;}setDock();});
