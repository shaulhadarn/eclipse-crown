// COMBAT (ported from the single-file build)
import './exploration.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { CLASSES, DIRS, MON, SPELLS } from '../data/constants.js';
import { $, Bus, C, S, advance, ensureHero, giveXP, has, healMul, isDay, isEclipse, mult, pAtk, pCrit, pDef, pick, ri, rnd, setC, setTile, skillDef, spCost, spellMul, ui } from '../core/state.js';
import { foeRelic, relicRound } from './relics.js';
import { banner, flash, floatCard, floatWorld, log, shake } from '../ui/log.js';
import { sfx } from '../audio/audio.js';
import { COOL_MON, monTex } from '../render/textures.js';
import { blob, buildLevel, combatGroup, dyn, glowSprite, sprite } from '../render/world.js';
import { lightning, wxType } from '../render/weather.js';
import { closeMenus, roamList } from './exploration.js';
import { esc } from '../ui/panels.js';
import { save, showEnding, showOverlay } from '../core/save.js';
import { story } from '../story/saga.js';
import { sparks } from '../core/loop.js';

export function startCombat(types,opts={}){
  S.mode='combat';closeMenus();
  const enemies=types.map((t,i)=>{const d=MON[t];const e={t,name:d.name,hp:d.hp,max:d.hp,atk:d.atk,def:d.def,spd:d.spd,xp:d.xp,gold:d.gold,drain:d.drain,boss:d.boss,acts:d.boss?2:1,alive:true,turns:0,spr:null,steal:d.steal,poisonHit:d.poison,web:d.web,dodge:d.dodge,charge:d.charge,regen:d.regen};
    if(opts.elite&&i===0&&!d.boss){e.elite=true;e.name='Dread '+e.name;e.hp=e.max=Math.round(d.hp*1.6);e.atk=Math.round(d.atk*1.25);e.def+=2;e.xp*=2;e.gold*=2;e.tint=0xffa898;}return e;});
  const tally={},seen={};enemies.forEach(e=>tally[e.name]=(tally[e.name]||0)+1);enemies.forEach(e=>{if(tally[e.name]>1){seen[e.name]=(seen[e.name]||0)+1;e.name+=' '+'ABCD'[seen[e.name]-1];}});
  S.party.forEach(p=>{ensureHero(p);p.cd={};});
  setC({enemies,queue:[],idx:0,round:0,ward:0,veil:0,wall:0,taunt:0,undying:false,surprise:opts.surprise||null,roamer:opts.roamer||null,stolen:0,key:opts.key||null,boss:!!opts.boss,step:'wait',actor:null,pending:null,busy:false});
  S.party.forEach(p=>p.defending=false);
  if(opts.key){const [x,y]=opts.key.split(',').map(Number);dyn.sprites=dyn.sprites.filter(s=>{if(Math.abs(s.position.x-(x+.5))<.01&&Math.abs(s.position.z-(y+.5))<.01){s.visible=false;return false;}return true;});}
  spawnCombatSprites();
  const names=[...new Set(types.map(t=>MON[t].name))].join(', ');
  log(opts.boss?'The Umbral Regent rises from its throne of dusk.':`Foes ahead: ${names}${opts.elite?' (one is a dread champion)':''}.`,'bad');
  if(C.surprise==='enemy'){banner('Ambush!');log('Ambush! The foes strike before you can act.','bad');flash('#a02a20');}
  if(C.surprise==='party'){banner('Surprise attack!');log('You catch them unaware. Your party strikes first!','good');}
  if(opts.boss&&!isEclipse())log('Its Umbral Ward swallows most harm. Only an eclipse will break it.','ecl');
  sfx('alarm');Bus.emit('hud');setTimeout(newRound,550);
}
function spawnCombatSprites(){
  while(combatGroup.children.length){const s=combatGroup.children.pop();s.material.dispose();if(!s.isSprite&&s.geometry)s.geometry.dispose();}
  $('#foes').innerHTML=C.enemies.map((e,i)=>`<button class="foebar" data-i="${i}" aria-label="Target ${esc(e.name)}"><span class="fn">${esc(e.name)}</span><span class="fb"><i style="width:100%"></i></span></button>`).join('');
  const [fx,fz]=DIRS[S.dir];const rx=-fz,rz=fx;const n=C.enemies.length;
  C.enemies.forEach((e,i)=>{const sc=e.boss?1.15:.52;const off=(i-(n-1)/2)*.56;const x=S.x+.5+fx*1.2+rx*off,z=S.y+.5+fz*1.2+rz*off;
    const esc2=e.elite?sc*1.18:sc;const s=sprite(monTex(e.t),esc2,esc2,x,e.boss?.52:.34+(esc2-sc)/2,z);if(e.tint)s.material.color.setHex(e.tint);s.material.depthTest=false;s.renderOrder=10;s.userData={base:s.position.y,i,sc:esc2,bx:x,bz:z,ph:Math.random()*6};e.spr=s;combatGroup.add(s);
    if(e.elite||e.boss){const au=glowSprite(e.boss?0x8a5cff:0xff3a1a,esc2*2.3,x,s.position.y,z,.5);au.material.depthTest=false;au.renderOrder=8;au.userData={aura:1,i,base:s.position.y};combatGroup.add(au);e.aura=au;}const bl=blob(x,z,sc*.4);bl.material.depthTest=false;bl.renderOrder=9;combatGroup.add(bl);e.blob=bl;});
}
function newRound(){
  if(!C)return;C.round++;if(C.round>1)advance(1);
  if(C.ward>0)C.ward--;if(C.veil>0)C.veil--;if(C.wall>0)C.wall--;if(C.taunt>0)C.taunt--;
  S.party.forEach(p=>{for(const k in p.cd)if(p.cd[k]>0)p.cd[k]--;if(p.hp>0&&has(p,'devote')&&p.sp<p.maxsp)p.sp++;});
  if(C.round>1)relicRound();
  if(C.round>1)C.enemies.forEach((e,i)=>{if(e.alive&&e.poison&&e.poison.t>0){e.poison.t--;damageEnemy(i,e.poison.d,'ward');log(`Venom burns ${e.name} for ${e.poison.d}.`,'dim');}});
  if(C.round>1){C.enemies.forEach((e,i)=>{if(e.alive&&e.regen&&e.hp<e.max){const h=Math.min(e.regen,e.max-e.hp);e.hp+=h;if(e.spr)floatWorld(e.spr,'+'+h,'heal');}});
    S.party.forEach((p,i)=>{if(p.hp>0&&p.poison&&p.poison.t>0){p.poison.t--;hurt(i,p.poison.d);log(`Poison burns ${p.name} for ${p.poison.d}.`,'bad');if(!p.poison.t)p.poison=null;}});}
  if(C.round>1&&wxType()==='storm'&&Math.random()<.2){const al=C.enemies.map((e,i)=>i).filter(i=>C.enemies[i].alive);if(al.length){const i=pick(al),e=C.enemies[i];const d=ri(14,24)+S.lvl*4;lightning();shake();damageEnemy(i,wardFilter(e,d)[0],'crit');log(`Lightning strikes ${e.name} for ${d}!`,'gold');}}
  if(checkEnd())return;
  const first=C.round===1?C.surprise:null;
  const q=[];if(first!=='enemy')S.party.forEach((p,i)=>{if(p.hp>0)q.push({k:'p',i,init:p.spd+Math.random()*4});});
  if(first!=='party')C.enemies.forEach((e,i)=>{if(e.alive)for(let a=0;a<e.acts;a++)q.push({k:'e',i,init:e.spd+Math.random()*4-a*4});});
  q.sort((a,b)=>b.init-a.init);C.queue=q;C.idx=0;nextTurn();
}
function nextTurn(){
  if(!C||checkEnd())return;
  if(C.idx>=C.queue.length){newRound();return;}
  const a=C.queue[C.idx++];
  if(a.k==='p'){const p=S.party[a.i];if(p.hp<=0){nextTurn();return;}if(p.stun>0){p.stun--;log(`${p.name} struggles free of the webbing and loses the turn.`,'dim');Bus.emit('hud');setTimeout(nextTurn,500);return;}p.defending=false;C.actor=a.i;C.step='action';C.pending=null;Bus.emit('hud');}
  else{const e=C.enemies[a.i];if(!e.alive){nextTurn();return;}C.actor=null;C.step='wait';Bus.emit('hud');setTimeout(()=>enemyAct(e),560);}
}
export function endPlayer(){C.step='wait';C.actor=null;setTimeout(nextTurn,520);Bus.emit('hud');}
setInterval(()=>{if(C&&S&&S.mode==='combat'&&C.enemies.every(e=>!e.alive)&&!C.ending){C.ending=true;try{victory();}catch(err){console.error(err);endCombat();Bus.emit('hud');}}},1500);
function checkEnd(){if(C.enemies.every(e=>!e.alive)){victory();return true;}if(S.party.every(p=>p.hp<=0)){defeat();return true;}return false;}
function lunge(e){if(!e.spr)return;e.spr.userData.lt=performance.now();}
export function hurt(i,d){const p=S.party[i];if(C&&C.wall>0)d=Math.ceil(d/2);p.hp=Math.max(0,p.hp-d);floatCard(i,'-'+d,'dmg');if(p.hp===0){log(`${p.name} falls!`,'bad');p.defending=false;
  const cl=S.party.find(q=>q!==p&&q.hp>0&&has(q,'undying'));if(C&&cl&&!C.undying){C.undying=true;p.hp=Math.ceil(p.maxhp*.25);floatCard(i,'+'+p.hp,'heal');log(`Undying Light! ${p.name} rises again.`,'gold');flash('#e8b04a');}}return d;}
function enemyAct(e){
  if(!C)return;e.turns++;lunge(e);
  if(e.boss&&e.turns%3===0){log(`${e.name} unleashes Night Tide!`,'bad');sfx('tide');flash('#3a2a8a');shake();S.party.forEach((p,i)=>{if(p.hp>0){let d=Math.round((e.atk*.75+rnd(0,6))*(isEclipse()?.6:1)-pDef(p)*.3);d=Math.max(2,p.defending?Math.ceil(d/2):d);hurt(i,d);}});Bus.emit('hud');setTimeout(nextTurn,650);return;}
  const w=S.party.map((p,i)=>p.hp>0?[3,2,2,1.4][i]:0);const tot=w.reduce((a,b)=>a+b,0);let r=Math.random()*tot,ti=0;for(;ti<4;ti++){r-=w[ti];if(r<=0)break;}ti=Math.min(ti,3);
  if(C.taunt>0&&S.party[0].hp>0)ti=0;
  const p=S.party[ti];
  if(e.charge&&!e.charged){e.charged=true;log(`${e.name} gathers starlight. Its next blow will be devastating.`,'bad');if(e.spr)floatWorld(e.spr,'charging','ward');Bus.emit('hud');setTimeout(nextTurn,560);return;}
  if(Math.random()>(C.veil?.55:.88)){log(`${e.name} lunges at ${p.name} and misses.`,'dim');floatCard(ti,'miss','miss');sfx('miss');e.charged=false;}
  else{let d=Math.round(e.atk+rnd(0,e.atk*.5)-(pDef(p)+(C.ward?4:0)+(C.taunt&&p.cls==='knight'?6:0))*.6);d=Math.max(1,d);if(e.charged){d=Math.round(d*2.2);e.charged=false;log(`${e.name} unleashes a blast of starfire!`,'bad');flash('#9ad0ff');}if(p.defending)d=Math.ceil(d/2);d=hurt(ti,d);log(`${e.name} strikes ${p.name} for ${d}.`,'bad');sfx('hurt');shake();
    if(p.hp>0&&e.web&&Math.random()<.35){p.stun=1;log(`${p.name} is caught in sticky webbing!`,'bad');}
    if(p.hp>0&&e.poisonHit&&Math.random()<.4){p.poison={d:4+S.lvl*2,t:3};log(`${p.name} is poisoned!`,'bad');}
    if(e.steal&&S.gold>0&&Math.random()<.4){const g=Math.min(S.gold,ri(5,15));S.gold-=g;C.stolen+=g;log(`${e.name} snatches ${g} gold!`,'bad');}
    if(p.hp>0&&has(p,'riposte')&&Math.random()<.3&&e.alive){const h=calcHit(p,e,.8);const ei=C.enemies.indexOf(e);damageEnemy(ei,wardFilter(e,h.d)[0],'crit');log(`${p.name} ripostes for ${h.d}!`,'good');}
    if(e.drain){const h=Math.ceil(d/2);e.hp=Math.min(e.max,e.hp+h);log(`${e.name} drinks the stolen life (+${h}).`,'bad');}}
  Bus.emit('hud');setTimeout(nextTurn,560);
}
function wardFilter(e,d){if(e.boss&&!isEclipse()){const nd=Math.max(1,Math.round(d*.25));return[nd,true];}return[d,false];}
function damageEnemy(i,d,cls){const e=C.enemies[i];e.hp=Math.max(0,e.hp-d);if(e.spr){e.spr.userData.ht=performance.now();sparks(e.spr.position,cls==='ward'?0xb48cff:cls==='crit'?0xffd27a:0xffb070,cls==='crit'?16:10);floatWorld(e.spr,String(d),cls||'dmg');e.spr.material.color.set(0xff6b5a);setTimeout(()=>e.spr&&e.spr.material.color.setHex(e.tint||0xffffff),140);}
  if(e.hp<=0&&e.alive){e.alive=false;if(e.blob)e.blob.visible=false;if(e.aura)e.aura.visible=false;log(`${e.name} is destroyed.`,'good');if(e.spr){e.spr.userData.dt=performance.now();sparks(e.spr.position,COOL_MON.test(e.t)?0x9a7aff:0x6a4a8a,26,1.6);}}}
function calcHit(p,e,mul=1){const atk=pAtk(p);let d=(atk+rnd(0,atk*.6))*mul-e.def*.7;if(has(p,'dawn')&&isDay())d*=1.3;if(has(p,'night')&&!isDay())d*=1.35;const crit=Math.random()<pCrit(p);if(crit)d*=1.8;return{d:Math.max(1,Math.round(d)),crit};}
export function useSkill(id,t){
  const p=S.party[C.actor],k=skillDef(p,id);if(k.sp)p.sp-=k.sp;if(k.cd)p.cd[id]=k.cd+1;
  const alive=()=>C.enemies.map((e,i)=>i).filter(i=>C.enemies[i].alive);
  const hitList=(idx,mul,lbl)=>{const out=idx.map(i=>{const e=C.enemies[i];if(!e.alive)return 0;if(e.dodge&&Math.random()<e.dodge){floatWorld(e.spr,'dodge','miss');return 0;}const h=calcHit(p,e,mul);const [fd,w]=wardFilter(e,h.d);damageEnemy(i,fd,w?'ward':'crit');return fd;});log(`${p.name} uses ${lbl}: ${out.join(', ')} damage.`,'gold');};
  const magic=(i,base,school,lbl)=>{const e=C.enemies[i];const d=Math.max(1,Math.round(base*spellMul(p,school)*rnd(.9,1.1)-e.def*.3));const [fd,w]=wardFilter(e,d);damageEnemy(i,fd,w?'ward':'crit');return fd;};
  sfx('hit');
  switch(id){
    case'wall':C.wall=3;log(`${p.name} raises a Shield Wall. The party takes half damage.`,'gold');flash('#c9d4e8');break;
    case'cleave':hitList(alive(),.7,'Cleave');break;
    case'taunt':C.taunt=3;log(`${p.name} bellows a challenge. Every foe turns on him.`,'gold');break;
    case'twin':{const a=alive();hitList([pick(a),pick(a)],.8,'Twin Shot');break;}
    case'venom':{hitList([t],1,'Venom Arrow');const e=C.enemies[t];if(e.alive)e.poison={d:6+p.lvl*2,t:3};break;}
    case'volley':hitList(alive(),1.1,'Volley');break;
    case'smite':{const e=C.enemies[t];const h=calcHit(p,e,1.5*mult('sun'));const [fd,w]=wardFilter(e,h.d);damageEnemy(t,fd,w?'ward':'crit');log(`${p.name} lands a Radiant Strike for ${fd}.`,'gold');flash('#e8b04a');break;}
    case'sanct':{const hv=Math.round(SPELLS.mend.heal(p.lvl)*.6*healMul(p));S.party.forEach((q,i)=>{if(q.hp>0){q.hp=Math.min(q.maxhp,q.hp+hv);floatCard(i,'+'+hv,'heal');}});log(`${p.name} calls down Sanctuary: +${hv} HP to all.`,'good');sfx('heal');flash('#e8b04a');break;}
    case'flare':{const out=alive().map(i=>magic(i,12+p.lvl*3,'sun'));C.veil=3;log(`${p.name} unleashes a Solar Flare: ${out.join(', ')} damage. Foes are blinded.`,'gold');flash('#ffd27a');break;}
    case'chain':{const a=alive();const order=[t].concat(a.filter(i=>i!==t)).slice(0,3);const out=order.map((i,j)=>magic(i,(10+p.lvl*2)*[1,.8,.65][j],'moon'));log(`${p.name} casts Chain Frost: ${out.join(', ')} damage.`,'time');flash('#6f9bff');break;}
    case'lward':C.veil=3;C.ward=3;log(`${p.name} weaves a Lunar Ward.`,'time');flash('#6f9bff');break;
    case'meteor':{const d=magic(t,40+p.lvl*6,'moon');log(`${p.name} calls down a Falling Star for ${d}!`,'time');flash('#b8c8ff');shake();break;}
  }
  endPlayer();
}
export function doAttack(ti){
  const p=S.party[C.actor],e=C.enemies[ti];const wt=wxType(),wet=wt==='rain'||wt==='storm';const hitCh=(p.cls==='ranger'?1:.92)-(wet?(p.cls==='ranger'?.12:.04):0);
  if(Math.random()>hitCh){log(`${p.name} swings at ${e.name} and misses.`,'dim');floatWorld(e.spr,'miss','miss');sfx('miss');endPlayer();return;}
  if(e.dodge&&Math.random()<e.dodge){log(`${e.name} flickers aside and the blow finds only glass.`,'dim');floatWorld(e.spr,'dodge','miss');sfx('miss');endPlayer();return;}
  const h=calcHit(p,e),d=h.d,crit=h.crit;
  const [fd,warded]=wardFilter(e,d);damageEnemy(ti,fd,warded?'ward':crit?'crit':'dmg');
  log(`${p.name} ${p.cls==='ranger'?'looses an arrow at':'strikes'} ${e.name} for ${fd}${crit?' (critical)':''}${warded?'. The Umbral Ward swallows the rest':''}.`);sfx('hit');endPlayer();
}
export function castSpell(key,t){
  const p=S.party[C?C.actor:ui.dcast.caster];const sp=SPELLS[key];const m=mult(sp.school),pm=spellMul(p,sp.school);p.sp-=spCost(p,sp);
  const col=sp.school==='sun'?'#e8b04a':'#6f9bff';flash(isEclipse()?'#9a6cff':col);sfx(sp.school);
  const tag=m>1.01?` (×${m})`:m<.99?' (weakened)':'';
  if(sp.tgt==='enemy'||sp.tgt==='all'){
    const targets=sp.tgt==='all'?C.enemies.map((e,i)=>i).filter(i=>C.enemies[i].alive):[t];
    const parts=[];targets.forEach(i=>{const e=C.enemies[i];let d=Math.max(1,Math.round(sp.pow(p.lvl)*pm*rnd(.9,1.1)-e.def*.3));const [fd,w]=wardFilter(e,d);damageEnemy(i,fd,w?'ward':'crit');parts.push(fd);});
    log(`${p.name} casts ${sp.name}${tag}: ${parts.join(', ')} damage.`,sp.school==='sun'?'gold':'time');
  }else if(sp.tgt==='ally'){const a=S.party[t];const h=Math.round(sp.heal(p.lvl)*healMul(p));a.hp=Math.min(a.maxhp,a.hp+h);floatCard(t,'+'+h,'heal');log(`${p.name} casts ${sp.name} on ${a.name}${tag}: +${h} HP.`,'good');}
  else if(sp.tgt==='fallen'){const a=S.party[t];a.hp=Math.max(1,Math.round(a.maxhp*.3*Math.min(m,1.5)));floatCard(t,'+'+a.hp,'heal');log(`${p.name} rekindles ${a.name}'s spirit.`,'good');}
  else if(sp.tgt==='party'){C.ward=3;log(`${p.name} raises a Dawn Ward over the party.`,'gold');}
  else if(sp.tgt==='foes'){C.veil=3;log(`${p.name} draws a Shadow Veil across the foes' eyes.`,'time');}
  if(C)endPlayer();else{ui.dcast=null;Bus.emit('hud');}
}
export function useItem(kind,t){const a=S.party[t];if(kind==='potion'){S.potions--;const h=Math.min(30,a.maxhp-a.hp);a.hp+=h;floatCard(t,'+'+h,'heal');log(`${a.name} drinks a potion (+${h} HP).`,'good');}else{S.ethers--;const h=Math.min(15,a.maxsp-a.sp);a.sp+=h;log(`${a.name} drinks an ether (+${h} SP).`,'good');}sfx('heal');if(C)endPlayer();else Bus.emit('hud');}
export function flee(){if(C.boss){log('There is no fleeing the Regent\'s hall.','bad');endPlayer();return;}const avg=S.party.reduce((a,p)=>a+(p.hp>0?p.spd:0),0)/4;if(Math.random()<.4+avg*.03){const k=C.key;if(C.roamer){const r=roamList().find(q=>q.id===C.roamer);if(r){r.wait=5;r.alert=0;}}log('The party breaks away and escapes.','dim');endCombat();if(k)buildLevel();Bus.emit('hud');}else{log('The party tries to flee, but the foes cut them off.','bad');endPlayer();}}
export function endCombat(){if(S)S.party.forEach(p=>{p.stun=0;p.poison=null;});while(combatGroup.children.length){const s=combatGroup.children.pop();s.material.dispose();if(!s.isSprite&&s.geometry)s.geometry.dispose();}$('#foes').innerHTML='';$('#foes').classList.remove('pick');setC(null);if(S)S.mode='explore';}
function victory(){if(!C)return;C.ending=true;
  const xp=C.enemies.reduce((a,e)=>a+e.xp,0),gold=C.enemies.reduce((a,e)=>a+e.gold,0)+C.stolen;const key=C.key,boss=C.boss;
  if(C.stolen)log(`You recover the ${C.stolen} stolen gold.`,'gold');if(C.roamer)S.roam[S.lvl]=roamList().filter(r=>r.id!==C.roamer);if(C.enemies.some(e=>e.elite)){S.potions++;log('The dread champion carried a potion.','gold');}
  S.gold+=gold;let loot='';if(Math.random()<.35){S.potions++;loot+=' and a potion';}if(Math.random()<.15){S.ethers++;loot+=' and an ether';}
  log(`Victory. Each standing hero gains ${xp} XP. Found ${gold} gold${loot}.`,'gold');sfx('win');
  if(!boss)foeRelic(C.enemies.some(e=>e.elite));
  giveXP(xp);
  endCombat();
  if(key){const [x,y]=key.split(',').map(Number);setTile(x,y,'.');buildLevel();}
  if(boss){S.flags.crown=true;save(true);setTimeout(showEnding,900);}else story('win1');
  Bus.emit('hud');
}
export function levelUp(p){const g=CLASSES[p.cls].grow;p.lvl++;p.maxhp+=g.hp;p.maxsp+=g.sp;p.atk+=g.atk;p.def+=g.def;p.spd+=g.spd;p.hp=p.maxhp;p.sp=p.maxsp;p.ap=(p.ap||0)+3;p.skp=(p.skp||0)+1;log(`${p.name} reaches level ${p.lvl}! +3 training points and +1 skill point. Tap the portrait to spend them.`,'gold');banner(`${p.name} · Level ${p.lvl}`);sfx('level');}
function defeat(){const c=C;endCombat();Bus.emit('hud');setTimeout(()=>showOverlay('defeat'),700);}
