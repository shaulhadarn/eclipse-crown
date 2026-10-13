// EXPLORATION (ported from the single-file build)
import '../render/weather.js'; // load-order chain: keeps the original top-to-bottom start-up order
import * as THREE from 'three';
import { DIRS, LEVELS, MON, STEP_MIN } from '../data/constants.js';
import { $, BLOCK, Bus, FIXED_IDX, LH, LW, NPC_IDX, S, advance, dayOf, giveXP, inMap, isDay, isEclipse, pick, ri, setTile, tile, ui } from '../core/state.js';
import { banner, flash, log, shake } from '../ui/log.js';
import { sfx } from '../audio/audio.js';
import { MV, anim, buildLevel, camera, queueAct, setYaw, snapCamera, startAnim, yaw } from '../render/world.js';
import { wxType } from '../render/weather.js';
import { hurt, startCombat } from './combat.js';
import { save, showOverlay } from '../core/save.js';
import { sheet } from '../ui/character-sheet.js';
import { intro } from '../story/prologue.js';
import { SCENES, ST, chapterCheck, maybeBark, pickLore, saga, sagaPush, story, titleCard } from '../story/saga.js';

export function markSeen(){const seen=S.seen[S.lvl],W=LW();const mk=(x,y)=>{if(inMap(x,y))seen[y*W+x]=1;};for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)mk(S.x+dx,S.y+dy);const [fx,fy]=DIRS[S.dir];for(let i=1;i<=6;i++){const x=S.x+fx*i,y=S.y+fy*i;if(!inMap(x,y))break;mk(x,y);mk(x-fy,y+fx);mk(x+fy,y-fx);if(tile(x,y)==='#')break;}}
function passable(x,y){const c=tile(x,y);if(BLOCK.includes(c))return false;if(c==='M')return !isDay();if(c==='U')return isDay();return true;}
export function canAct(){return S&&S.mode==='explore'&&!anim.active&&$('#overlay').hidden&&!intro.active&&sheet.i==null&&!saga.on&&$('#journal').hidden;}

export function turn(d){if(!canAct()){queueAct(()=>turn(d));return;}S.dir=(S.dir+d+4)%4;startAnim(camera.position.clone(),yaw-d*Math.PI/2,230,()=>{setYaw(-S.dir*Math.PI/2);markSeen();Bus.emit('hud');},{kind:'turn'});}
export function move(rel){ // rel: 0 fwd, 2 back, 1 right, 3 left
  if(!canAct()){queueAct(()=>move(rel));return;}
  const [dx,dy]=DIRS[(S.dir+rel)%4];const nx=S.x+dx,ny=S.y+dy;const c=tile(nx,ny);
  if(c==='K'){
    if(S.flags.sun&&S.flags.moon){setTile(nx,ny,'.');log('You press both sigils into the sockets. The sealed door grinds open.','gold');sfx('door');buildLevel();story('door');}
    else{log('A sealed iron door with two empty sockets: one gilded, one silver.','dim');sfx('bump');closeMenus();return;}
  }
  if(!passable(nx,ny)){
    if(c==='M')log('The silver gate is shut fast. It opens only beneath the moon.','dim');
    else if(c==='U')log('The gilded gate is shut fast. It opens only beneath the sun.','dim');
    sfx('bump');bump(dx,dy);return;
  }
  closeMenus();
  S.x=nx;S.y=ny;sfx('step');
  startAnim(new THREE.Vector3(nx+.5,.5,ny+.5),yaw,rel===2?270:rel===0?250:240,()=>{advance(STEP_MIN);markSeen();arrive();},{kind:'walk',rel});
}
function bump(dx,dy){MV.q=null;startAnim(camera.position.clone(),yaw,260,null,{kind:'bump',bdir:new THREE.Vector3(dx,0,dy)});}
export function closeMenus(){ui.menu=null;ui.detail=null;ui.dcast=null;}
function arrive(){
  const c=tile(S.x,S.y);const key=S.x+','+S.y;
  if(!pickLore())maybeBark();
  const met=roamActive()&&roamerAt(S.x,S.y);if(met){fightRoamer(met,'party');return;}
  switch(c){
    case'=':changeLevel(LEVELS[S.lvl].link,'road');return;
    case'Y':useShrine(key);break;
    case'>':changeLevel(S.lvl+1,'down');return;
    case'<':changeLevel(S.lvl-1,'up');return;
    case'I':ui.menu='inn';break;
    case'S':ui.menu='shop';break;
    case'T':ui.menu='temple';break;
    case'G':ui.menu='guild';break;
    case'N':ui.menu='npc';ui.arg=NPC_IDX[S.lvl][key];break;
    case'C':openChest();break;
    case'1':setTile(S.x,S.y,'.');S.flags.sun=true;log('You lift the Sun Sigil from its pedestal. It is warm as a hearthstone.','gold');giveXP(150,'A sigil claimed.');banner('Sun Sigil claimed');sfx('level');buildLevel();story('sun');if(S.flags.moon)story('both');break;
    case'2':setTile(S.x,S.y,'.');S.flags.moon=true;log('You lift the Moon Sigil from its pedestal. Frost gathers on your glove.','gold');giveXP(150,'A sigil claimed.');banner('Moon Sigil claimed');sfx('level');buildLevel();story('moon');if(S.flags.sun)story('both');break;
    case'F':useFountain(key);break;
    case'A':useAltar();break;
    case'E':startCombat(LEVELS[S.lvl].fixed[FIXED_IDX[S.lvl][key]],{key});return;
    case'B':story('boss',()=>startCombat(['regent'],{key,boss:true}));return;
    default:if(!roamCheck())rollEncounter();
  }
  Bus.emit('hud');
}
const ROAM={0:{n:3,night:1,groups:[['thief'],['thief','thief'],['wolf','wolf']]},
 1:{n:5,groups:[['skel','skel'],['ghoul','rat'],['spider','spider'],['wight','skel'],['ghoul','ghoul']]},
 2:{n:5,groups:[['golem','shade'],['sentinel'],['uknight','moth'],['shade','shade'],['eater','golem']]},
 3:{n:6,groups:[['boar','boar'],['bandit','bandit'],['barkling','wolf'],['bear'],['bandit','bandit','wolf'],['barkling','barkling']]}};
const ROAMABLE='.,fmc';
export const roamList=()=>(S.roam=S.roam||{},S.roam[S.lvl]=S.roam[S.lvl]||[]);
export const roamActive=()=>{const R=ROAM[S.lvl];return !!R&&(!R.night||!isDay());};
const roamerAt=(x,y)=>roamList().find(r=>r.x===x&&r.y===y);
function roamFree(x,y){return inMap(x,y)&&ROAMABLE.includes(tile(x,y))&&!roamerAt(x,y);}
function spawnRoamer(far){const R=ROAM[S.lvl];if(!R)return;for(let k=0;k<80;k++){const x=ri(1,LW()-2),y=ri(1,LH()-2);if(!roamFree(x,y)||Math.abs(x-S.x)+Math.abs(y-S.y)<far)continue;roamList().push({x,y,g:pick(R.groups),elite:Math.random()<.15,id:'r'+Math.floor(Math.random()*1e9),wait:0,alert:0});return;}}
export function ensureRoamers(){S.roam=S.roam||{};if(!S.roam[S.lvl]){S.roam[S.lvl]=[];const R=ROAM[S.lvl];if(R)for(let i=0;i<R.n;i++)spawnRoamer(8);}}
function pathStep(r){const prev={};const k0=r.x+','+r.y;prev[k0]=null;const q=[[r.x,r.y]];let hit=null;
  while(q.length){const [x,y]=q.shift();if(x===S.x&&y===S.y){hit=[x,y];break;}if(Math.abs(x-r.x)+Math.abs(y-r.y)>9)continue;
    for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(k in prev)continue;const goal=nx===S.x&&ny===S.y;if(!goal&&(!ROAMABLE.includes(tile(nx,ny))||roamerAt(nx,ny)))continue;prev[k]=[x,y];q.push([nx,ny]);}}
  if(!hit)return null;let cur=hit,pv=prev[cur[0]+','+cur[1]];while(pv&&!(pv[0]===r.x&&pv[1]===r.y)){cur=pv;pv=prev[cur[0]+','+cur[1]];}return cur;}
function moveRoamers(){
  if(!roamActive())return null;const list=roamList();let caught=null;
  for(const r of list){if(r.wait>0){r.wait--;continue;}const d=Math.abs(r.x-S.x)+Math.abs(r.y-S.y);
    if(d<=(wxType()==='fog'?3:5)){const n=pathStep(r);if(n){if(!r.alert){r.alert=1;log(`${r.elite?'A dread ':''}${MON[r.g[0]].name}${r.g.length>1?' and company':''} ${r.elite?'has':'have'} spotted you!`,'bad');sfx('alarm');}if(Math.random()<.85){r.x=n[0];r.y=n[1];}}}
    else{r.alert=0;if(Math.random()<.5){const [dx,dy]=pick(DIRS);if(roamFree(r.x+dx,r.y+dy)&&!(r.x+dx===S.x&&r.y+dy===S.y)){r.x+=dx;r.y+=dy;}}}
    if(r.x===S.x&&r.y===S.y&&!caught)caught=r;}
  if(list.length<ROAM[S.lvl].n&&Math.random()<.04)spawnRoamer(9);
  return caught;}
function fightRoamer(r,who){const sur=who==='party'?(Math.random()<.6?'party':null):(Math.random()<.5?'enemy':null);
  log(who==='party'?`You charge the ${MON[r.g[0]].name}!`:`The ${MON[r.g[0]].name} catches up with you!`,'bad');startCombat(r.g,{roamer:r.id,elite:r.elite,surprise:sur});}
function roamCheck(){const c=moveRoamers();if(c){fightRoamer(c,'enemy');return true;}return false;}
function rollSurprise(){const agi=S.party.reduce((a,p)=>a+(p.hp>0?p.spd:0),0)/4;const r=Math.random();if(r<Math.max(.08,.28-agi*.015)+(wxType()==='fog'?.14:0))return'enemy';if(r>.84-agi*.01)return'party';return null;}
function trap(msg,a,b){const alive=S.party.map((p,i)=>i).filter(i=>S.party[i].hp>0);if(!alive.length)return;const i=pick(alive),p=S.party[i];
  if(Math.random()<p.crit*2+.12){log(`${msg} ${p.name} dodges just in time.`,'dim');return;}const d=ri(a,b);hurt(i,d);log(`${msg} ${p.name} takes ${d} damage.`,'bad');shake();sfx('hurt');
  if(S.party.every(q=>q.hp<=0))setTimeout(()=>showOverlay('defeat'),600);}
const EVENTS={
 0:[{night:1,w:3,f:()=>{log('A cutpurse lunges out of a dark alley!','bad');startCombat(['thief'],{surprise:'enemy'});}},{w:2,f:()=>{const g=ri(3,12);S.gold+=g;log(`You spot ${g} gold glinting between the cobbles.`,'gold');sfx('coin');}}],
 1:[{w:3,f:()=>trap('A flagstone clicks and darts hiss from the walls!',4,10)},{w:2,f:()=>{log('Bones rattle in the dark. The dead rise around you!','bad');startCombat(['skel','skel','rat'],{surprise:'enemy'});}},
    {w:2,f:()=>{log('Webs brush your face. Something skitters overhead!','bad');startCombat(['spider','spider'],{surprise:'enemy'});}},{w:2,f:()=>{const g=ri(10,30);S.gold+=g;log(`A forgotten pilgrim's purse: ${g} gold.`,'gold');sfx('coin');}},
    {night:1,w:2,f:()=>{log('A ghoul claws its way up through the floor!','bad');startCombat(['ghoul'],{surprise:'enemy',elite:Math.random()<.35});}}],
 2:[{w:3,f:()=>{log('A mirror flashes. Your reflections step out of the glass!','bad');startCombat(['shade','shade'],{surprise:'enemy'});}},{w:2,f:()=>trap('The floor crackles with stray starfire!',8,16)},
    {w:2,f:()=>{S.party.forEach(p=>{if(p.hp>0&&p.maxsp)p.sp=Math.min(p.maxsp,p.sp+8);});log('Starlight pools on the floor. Casters recover 8 SP.','good');sfx('heal');}},{w:1,f:()=>{log('A Star Sentinel grinds out of an alcove!','bad');startCombat(['sentinel'],{surprise:'enemy',elite:true});}}],
 3:[{w:3,f:()=>{log('Bandits leap out of the bushes!','bad');startCombat(['bandit','bandit'],{surprise:'enemy'});}},{night:1,w:2,f:()=>{log('Branches crack. A Moss Bear rears out of the dark!','bad');startCombat(['bear'],{surprise:'enemy',elite:Math.random()<.3});}},
    {w:2,f:()=>{S.party.forEach(p=>{if(p.hp>0)p.hp=Math.min(p.maxhp,p.hp+10);});log('Wild brambleberries. Everyone recovers 10 HP.','good');sfx('heal');}},{w:2,f:()=>trap('A hunter\'s snare snaps shut!',5,11)},
    {w:2,f:()=>{log('The undergrowth stirs. Barklings uproot themselves!','bad');startCombat(['barkling','barkling'],{surprise:rollSurprise()});}}]};
function stepEvent(){const list=(EVENTS[S.lvl]||[]).filter(e=>!e.night||!isDay());if(!list.length)return;const tot=list.reduce((a,e)=>a+e.w,0);let r=Math.random()*tot;for(const e of list){r-=e.w;if(r<=0){S.stepsSince=0;e.f();return;}}}
function rollEncounter(){
  const L=LEVELS[S.lvl];if(S.stepsSince++<3)return;
  const ch=L.danger+(isDay()?0:L.nightExtra)+(wxType()==='storm'?.02:wxType()==='fog'?.015:0);
  if(Math.random()<ch){const pool=isDay()?L.pool:L.pool.concat(L.nightPool,L.nightPool);if(!pool.length)return;S.stepsSince=0;const n=ri(L.size[0],L.size[1]);startCombat(Array.from({length:n},()=>pick(pool)),{surprise:rollSurprise(),elite:Math.random()<.08});return;}
  if(Math.random()<.04)stepEvent();
}
function changeLevel(nl,how){
  S.lvl=nl;const want=how==='road'?'=':how==='down'?'<':'>';
  for(let y=0;y<LH();y++)for(let x=0;x<LW();x++)if(tile(x,y)===want){S.x=x;S.y=y;}
  for(let d=0;d<4;d++){const [dx,dy]=DIRS[d];if(passable(S.x+dx,S.y+dy)){S.dir=d;break;}}
  closeMenus();buildLevel();snapCamera();markSeen();
  S.visited=S.visited||{0:1};if(!S.visited[nl]){S.visited[nl]=1;setTimeout(()=>{giveXP(60,`New land discovered: ${LEVELS[nl].name}.`);Bus.emit('hud');},400);}
  const L=LEVELS[nl];log(how==='road'?`You follow the road to ${L.name}.`:`You ${how==='down'?'descend into':'climb up to'} ${L.name}.`,'gold');
  if(!ST().seen['enter'+nl]&&SCENES['enter'+nl]){chapterCheck();sagaPush(done=>titleCard('area',L.sub,L.name,'',done));story('enter'+nl);}else banner(L.name);
  save(true);Bus.emit('hud');
}
function openChest(){setTile(S.x,S.y,'.');const g=ri(40,90)*(S.lvl+1);S.gold+=g;let extra='';if(Math.random()<.7){S.potions++;extra+=', a potion';}if(Math.random()<.4){S.ethers++;extra+=', an ether';}log(`The chest holds ${g} gold${extra}.`,'gold');sfx('coin');giveXP(15*(S.lvl+1),'Treasure found.');buildLevel();}
function useShrine(key){const k=S.lvl+':'+key;if(S.fount[k]===dayOf()){log('The stones are quiet. They wake again tomorrow.','dim');return;}S.fount[k]=dayOf();const ecl=isEclipse(),day=isDay();
  S.party.forEach(p=>{if(p.hp>0){if(day||ecl)p.hp=p.maxhp;if(!day||ecl)p.sp=p.maxsp;}});
  log(ecl?'Sun and moon pour through the stone circle. Body and mind are restored.':day?'Sunlight pools in the circle. Every wound closes.':'Moonlight pools in the circle. Spell points restored.',ecl?'ecl':'good');flash(ecl?'#9a70ff':day?'#e8b04a':'#6f9bff');sfx('heal');}
function useFountain(key){const k=S.lvl+':'+key;if(S.fount[k]===dayOf()){log('The basin is still. It refills at the turn of the day.','dim');return;}S.fount[k]=dayOf();S.party.forEach(p=>{if(p.hp>0)p.sp=p.maxsp;});log('You drink from the fountain. Spell points restored.','good');sfx('heal');}
function useAltar(){
  if(isEclipse()){log('The eclipse already burns overhead. The altar hums, content.','ecl');return;}
  if(S.flags.sun&&S.flags.moon){S.flags.riteUntil=S.time+120;log('You set both sigils on the altar. Sun and moon are drawn into one sky. A kindled eclipse will last two hours.','ecl');banner('Eclipse kindled');flash('#8a5cff');sfx('ecl');Bus.emit('hud');}
  else log('An altar with two hollows, one gilded and one silver. Without both sigils it stays dark.','dim');
}
export function waitHour(){if(!canAct())return;closeMenus();advance(60);log('The party waits an hour.','dim');for(let k=0;k<3&&S.mode==='explore';k++)if(roamCheck())return;if(!LEVELS[S.lvl].outdoor&&Math.random()<.25){S.stepsSince=9;rollEncounter();}Bus.emit('hud');}
export function camp(){if(!canAct())return;closeMenus();advance(480);S.party.forEach(p=>{if(p.hp>0){p.hp=Math.min(p.maxhp,p.hp+Math.ceil(p.maxhp*.45));p.sp=Math.min(p.maxsp,p.sp+Math.ceil(p.maxsp*.45));}});log('You make a cold camp for eight hours and recover some strength.','good');if(Math.random()<.35){log('Something finds you in the dark!','bad');S.stepsSince=9;const L=LEVELS[S.lvl];const pool=L.pool.concat(L.nightPool);startCombat(Array.from({length:ri(2,3)},()=>pick(pool)));}Bus.emit('hud');}
