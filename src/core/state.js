// EVENT BUS & STATE (ported from the single-file build)
import '../data/constants.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { CLASSES, GEAR_A, GEAR_W, LEVELS, SKILLS, TIER_COST, TIER_LVL, xpNeed } from '../data/constants.js';
import { relicBonus } from '../data/relics';
import { banner, log } from '../ui/log.js';
import { sfx } from '../audio/audio.js';
import { wxMag, wxTick } from '../render/weather.js';
import { levelUp } from '../game/combat.js';
import { intro } from '../story/prologue.js';
import { story } from '../story/saga.js';

export const Bus={h:{},hq:0,ht:0,on(e,f){(this.h[e]||(this.h[e]=[])).push(f)},emit(e,d){if(e==='hud'&&this.ready){this.hq=1;return;}this.fire(e,d);},
  fire(e,d){(this.h[e]||[]).forEach(f=>{try{f(d);}catch(err){console.error(err);}})},
  flush(now,walking){if(!this.hq)return;if(walking&&now-this.ht<260)return;this.hq=0;this.ht=now;this.fire('hud');}};
export const rnd=(a,b)=>a+Math.random()*(b-a);
export const ri=(a,b)=>Math.floor(rnd(a,b+1));
export const pick=a=>a[Math.floor(Math.random()*a.length)];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const $=s=>document.querySelector(s);

export let S=null;       // game state (serialisable)
export let C=null;       // combat state
export const ui={menu:null,arg:null,detail:null,dcast:null};

function mkHero(name,cls){const c=CLASSES[cls];return{name,cls,lvl:1,xp:0,hp:c.hp,maxhp:c.hp,sp:c.sp,maxsp:c.sp,atk:c.atk,def:c.def,spd:c.spd,crit:c.crit,w:0,a:0,
  spells:cls==='cleric'?['spark','mend']:cls==='sorc'?['frost']:[],defending:false,ap:0,skp:1,skills:[],alloc:{mig:0,vit:0,agi:0,spi:0},cd:{},relic:null};}
export function ensureHero(p){if(p.ap==null)p.ap=0;if(p.skp==null)p.skp=1;if(!p.skills)p.skills=[];if(!p.alloc)p.alloc={mig:0,vit:0,agi:0,spi:0};if(!p.cd)p.cd={};if(p.relic===undefined)p.relic=null;return p;}
export const has=(p,id)=>!!(p.skills&&p.skills.includes(id));
export const skillDef=(p,id)=>SKILLS[p.cls].find(k=>k.id===id);
export function skillState(p,k){if(has(p,k.id))return'learned';if(p.lvl<TIER_LVL[k.tier])return'level';if(k.tier>1&&!SKILLS[p.cls].some(o=>o.tier===k.tier-1&&has(p,o.id)))return'prereq';if(p.skp<TIER_COST[k.tier])return'points';return'ready';}
export function learnSkill(p,id){const k=skillDef(p,id);if(skillState(p,k)!=='ready')return;p.skp-=TIER_COST[k.tier];p.skills.push(id);
  if(id==='tough'){p.maxhp+=20;if(p.hp>0)p.hp+=20;}if(id==='fleet')p.spd+=2;if(id==='mark')p.crit+=.15;if(id==='devote'){p.maxsp+=10;p.sp+=10;}if(id==='font'){p.maxsp+=12;p.sp+=12;}
  log(`${p.name} learns ${k.name}. ${k.desc}`,'gold');sfx('level');}
export function train(p,st){if(p.ap<1)return;if(st==='spi'&&!p.maxsp)return;p.ap--;p.alloc[st]++;if(st==='mig')p.atk+=1;if(st==='vit'){p.maxhp+=6;if(p.hp>0)p.hp+=6;}if(st==='agi'){p.spd+=.4;p.crit+=.01;}if(st==='spi'){p.maxsp+=4;p.sp+=4;}sfx('coin');}
export const spellMul=(p,school)=>mult(school)*(1+(p.alloc?p.alloc.spi:0)*.03)*(p.cls==='sorc'&&has(p,'focus')?1.2:1)*(1+rb(p,'spell'));
export const healMul=p=>mult('sun')*(1+(p.alloc?p.alloc.spi:0)*.03)*(has(p,'bless')?1.25:1)*(1+rb(p,'heal'));
export const spCost=(p,sp)=>sp.school==='moon'&&has(p,'tide2')?Math.max(1,sp.sp-2):sp.sp;
export function giveXP(n,why){const alive=S.party.filter(p=>p.hp>0);alive.forEach(p=>{p.xp+=n;while(p.xp>=xpNeed(p.lvl)){p.xp-=xpNeed(p.lvl);levelUp(p);}});if(why)log(`${why} +${n} XP to each standing hero.`,'gold');}
export function newState(){
  const maps=LEVELS.map(L=>L.map.map(r=>r.split('')));
  let sx=1,sy=1;maps[0].forEach((r,y)=>r.forEach((c,x)=>{if(c==='@'){sx=x;sy=y;r[x]='.';}}));
  return{lvl:0,x:sx,y:sy,dir:0,time:8*60,gold:60,potions:3,ethers:1,stepsSince:0,
    party:[mkHero('Aldric','knight'),mkHero('Sefa','ranger'),mkHero('Brother Oren','cleric'),mkHero('Ilyra','sorc')],
    relics:[],maps,seen:LEVELS.map(L=>Array(L.W*L.H).fill(0)),flags:{sun:false,moon:false,riteUntil:-1,crown:false},weather:{t:'clear',until:8*60+ri(150,300)},fount:{},mode:'explore',started:Date.now(),story:{seen:{},lore:{},ch:-1,steps:0,lastBark:0}};
}
// fixed encounter & npc indices from the original maps
export const FIXED_IDX=LEVELS.map(L=>{const m={};let i=0;L.map.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='E')m[x+','+y]=i++}));return m;});
export const NPC_IDX=LEVELS.map(L=>{const m={};let i=0;L.map.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='N')m[x+','+y]=i++}));return m;});

export const LW=(l=S.lvl)=>LEVELS[l].W,LH=(l=S.lvl)=>LEVELS[l].H;
export const inMap=(x,y,l=S.lvl)=>x>=0&&y>=0&&x<LW(l)&&y<LH(l);
export const tile=(x,y,l=S.lvl)=>inMap(x,y,l)?S.maps[l][y][x]:(LEVELS[l].outdoor?'t':'#');
export const BLOCK='#Kthwogukqry';
export const NATS=',fthwogmcukqyrbYv';
export const setTile=(x,y,c)=>{S.maps[S.lvl][y][x]=c;};
export const hourOf=()=>(S.time%1440)/60;
export const dayOf=()=>Math.floor(S.time/1440)+1;
export const isDay=()=>{const h=hourOf();return h>=6&&h<18;};
const naturalEclipse=()=>dayOf()%3===0&&hourOf()>=12&&hourOf()<13;
export const isEclipse=()=>naturalEclipse()||S.time<S.flags.riteUntil;
const baseMult=school=>isEclipse()?2:(school==='sun'?(isDay()?1.5:.7):(isDay()?.7:1.5));
export const mult=school=>Math.round(baseMult(school)*(typeof wxMag==='function'&&S?wxMag(school):1)*100)/100;
// relic bonus for a stat under the current sky (see data/relics.ts)
export const rb=(p,stat)=>S?relicBonus(p.relic,stat,isDay(),isEclipse()):0;
export const pAtk=p=>Math.round(p.atk+GEAR_W[p.w].b+rb(p,'atk'));
export const pDef=p=>Math.round(p.def+GEAR_A[p.a].b+rb(p,'def'));
export const pCrit=p=>p.crit+rb(p,'crit');
export const fmtT=()=>{const m=S.time%1440;return`Day ${dayOf()} · ${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;};

export function advance(min){
  const wasDay=isDay(),wasE=isEclipse();
  S.time+=min;wxTick();
  if(wasDay!==isDay()){log(isDay()?'The sun rises over Hollowmere. Sun magic waxes.':'Night falls. Moon magic waxes, and the crypts stir.','time');if(!isDay()&&S.story)story('night1');}
  if(wasE!==isEclipse()){if(isEclipse()){log('ECLIPSE. Sun and moon share one sky. All magic is doubled.','ecl');banner('Eclipse');sfx('ecl');if(S.story&&!intro.active)story('eclipse');}else log('The eclipse passes.','time');}
  Bus.emit('hud');
}
export function advanceTo(hour){let d=((hour*60-(S.time%1440))+1440)%1440;if(d===0)d=1440;advance(d);}

export function setS(v){S=v;}

export function setC(v){C=v;}
