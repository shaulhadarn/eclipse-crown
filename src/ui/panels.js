// PANELS (ported from the single-file build)
import '../game/combat.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { CLASSES, GEAR_A, GEAR_W, LEVELS, PRICES, SKILLS, SPELLS, xpNeed } from '../data/constants.js';
import { $, Bus, C, S, advanceTo, dayOf, has, isDay, isEclipse, mult, pAtk, pDef, skillDef, spCost, ui } from '../core/state.js';
import { log } from './log.js';
import { sfx } from '../audio/audio.js';
import { monImg } from '../render/textures.js';
import { WXT, wxChip, wxType } from '../render/weather.js';
import { camp, closeMenus, waitHour } from '../game/exploration.js';
import { castSpell, doAttack, endPlayer, flee, useItem, useSkill } from '../game/combat.js';
import { PORTRAITS } from './hud.js';
import { save } from '../core/save.js';

const ICONS={
  book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M9 7h7M9 10.5h5"/>',check:'<path d="M5 12.5l4.5 4.5L19 7"/>',dot:'<circle cx="12" cy="12" r="3.2"/>',
 sword:'<path d="M14.5 3.5H20v5.5L9.5 19.5l-5-5z"/><path d="M4 20l3-3M7.5 12.5l4 4"/>',
 bow:'<path d="M6 3c7 3 7 15 0 18"/><path d="M6 3v18M3 12h16M16 9l3 3-3 3"/>',
 star:'<path d="M12 3l2.3 5.7L20 9.5l-4.5 3.8L17 19l-5-3-5 3 1.5-5.7L4 9.5l5.7-.8z"/>',
 flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 14h9"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
 flee:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M11 4H4v16h16v-7"/>',
 back:'<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
 glass:'<path d="M6 3h12M6 21h12M7 3v2a5 5 0 0 0 10 0V3M7 21v-2a5 5 0 0 1 10 0v2"/>',
 tent:'<path d="M3 20h18M12 4 3 20M12 4l9 16M12 12l-3 8M12 12l3 8"/>',
 save:'<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
 drop:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
 skull:'<path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5a7 7 0 0 0-7-7z"/><circle cx="9.3" cy="10.5" r="1.4"/><circle cx="14.7" cy="10.5" r="1.4"/><path d="M10 18v3M14 18v3"/>',
 coin:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2-1 1.7-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.8 2.5-2"/>',
 heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
 alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
 cloud:'<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.4 1.5A3.3 3.3 0 0 0 7 18z"/>',
 map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
 claw:'<path d="M6 4c2 4 2 9 0 16M11 3c2 5 2 11 0 18M16 4c2 4 2 9 0 16"/>',
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
 chat:'<path d="M4 5h16v10H9l-5 4z"/>',
 miss:'<path d="M5 12h14M13 6l6 6-6 6"/><path d="M4 5l3 3M4 19l3-3"/>'
};
export const IC=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
function TL(act,icon,label,sub,{arg=null,dis=false,cls=''}={}){return`<button class="tile ${cls}" data-act="${act}"${arg!=null?` data-arg="${arg}"`:''} ${dis?'disabled':''}>${IC(icon)}<span class="tl">${label}</span>${sub?`<span class="ts">${sub}</span>`:''}</button>`;}
export const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function B(act,label,{dis=false,cls='',r='',wide=false}={}){return`<button class="btn ${cls} ${wide?'wide':''}" data-act="${act}" ${dis?'disabled':''}>${label}${r?`<span class="r">${r}</span>`:''}</button>`;}
function skyChips(){const ch=[wxChip()];if(isEclipse())ch.push(`<span class="chip ecl">Eclipse · Sun ×${mult('sun')} · Moon ×${mult('moon')}</span>`);else if(isDay())ch.push(`<span class="chip sun">Sun ×${mult('sun')}</span><span class="chip moon">Moon ×${mult('moon')}</span>`);else ch.push(`<span class="chip moon">Moon ×${mult('moon')}</span><span class="chip sun">Sun ×${mult('sun')}</span>`);return ch.join('');}
export function renderPanel(){
  const P=$('#panel');let h='';
  if(S.mode==='combat'&&C){
    const p=C.actor!=null?S.party[C.actor]:null;
    // --- header: whose turn, round, sky, turn order ---
    const cur=C.queue[C.idx-1];const up=C.queue.slice(Math.max(0,C.idx-1)).filter(a=>a.k==='p'?S.party[a.i].hp>0:C.enemies[a.i].alive).slice(0,6);
    const who=p?`<img class="bh-pic" alt="" src="${PORTRAITS[p.cls]}"><div class="bh-t"><b>${esc(p.name.split(' ').pop())}'s turn</b><span>Round ${C.round||1} · ${isEclipse()?'Eclipse ×2':isDay()?'☀ Sun ×1.5':'☾ Moon ×1.5'}${C.ward?` · Ward ${C.ward}`:''}${C.veil?` · Veil ${C.veil}`:''}${C.wall?` · Wall ${C.wall}`:''}</span></div>`
      :`<img class="bh-pic foe" alt="" src="${monImg((cur&&cur.k==='e'?C.enemies[cur.i]:(C.enemies.find(e=>e.alive)||C.enemies[0])).t)}"><div class="bh-t"><b class="bad">${cur&&cur.k==='e'?esc(C.enemies[cur.i].name):'The foes'} ${cur&&cur.k==='e'?'acts':'move'}…</b><span>Round ${C.round||1}</span></div>`;
    h+=`<div class="bhead">${who}<div class="tq" aria-label="Turn order">${up.map((a,j)=>`<img class="${a.k==='e'?'e':''} ${j===0?'now':''}" alt="" src="${a.k==='p'?PORTRAITS[S.party[a.i].cls]:monImg(C.enemies[a.i].t)}">`).join('')}</div></div>`;
    const tgtMode=C.step==='target';
    h+='<div class="col foelist">'+C.enemies.map((e,i)=>{const pct=Math.round(e.hp/e.max*100);const row=`<span>${esc(e.name)}</span><div class="bar hp"><i style="width:${pct}%"></i><span>${e.hp}</span></div>`;return tgtMode&&e.alive?`<button class="btn wide foe" data-act="tgt" data-arg="${i}" style="display:grid">${row}</button>`:`<div class="foe ${e.alive?'':'dead'}">${row}</div>`;}).join('')+'</div>';
    let kn=0;const AB=(act,icon,label,sub,o={})=>{kn++;return`<button class="ab ${o.cls||''}" data-act="${act}"${o.arg!=null?` data-arg="${o.arg}"`:''} ${o.dis?'disabled':''}><span class="kn">${kn}</span><span class="med">${IC(icon)}</span><span class="al">${label}</span>${sub?`<span class="as">${sub}</span>`:''}</button>`;};
    if(C.step==='action'&&p){
      h+='<div class="abar">';
      h+=AB('attack',p.cls==='ranger'?'bow':'sword',p.cls==='ranger'?'Shoot':'Attack',`ATK ${pAtk(p)}`,{cls:'primary'});
      if(p.spells.length){const sc=CLASSES[p.cls].school;h+=AB('castmenu',sc,'Cast',`${p.sp} SP`,{cls:sc});}
      const acts=SKILLS[p.cls].filter(k=>k.act&&has(p,k.id));if(acts.length){const ready=acts.filter(k=>!(p.cd[k.id]>0)&&(!k.sp||p.sp>=k.sp)).length;h+=AB('skillmenu','star','Skills',`${ready}/${acts.length} ready`,{cls:ready?'hot':''});}
      h+=AB('itemmenu','flask','Item',`${S.potions}·${S.ethers}`,{dis:!S.potions&&!S.ethers});
      h+=AB('defend','shield','Guard','½ harm');h+=AB('flee','flee','Flee',C.boss?'no escape':'run',{dis:C.boss});h+='</div>';
      h+='<p class="bhint">Tap a glowing foe to attack it directly.</p>';
    }else if(C.step==='spell'&&p){
      h+='<div class="abar">';
      p.spells.forEach(k=>{const s=SPELLS[k];const ok=p.sp>=spCost(p,s)&&(s.tgt!=='fallen'||S.party.some(q=>q.hp<=0));h+=AB('spell',s.school,s.name,`${spCost(p,s)} SP`,{arg:k,dis:!ok,cls:s.school});});
      h+=AB('back','back','Back','',{cls:'ghost'})+'</div>';
    }else if(C.step==='skill'&&p){h+='<div class="abar">';SKILLS[p.cls].filter(k=>k.act&&has(p,k.id)).forEach(k=>{const cd=p.cd[k.id]>0?p.cd[k.id]:0;const ok=!cd&&(!k.sp||p.sp>=k.sp);h+=AB('skill','star',k.name,cd?`in ${cd}`:k.sp?`${k.sp} SP`:`cd ${k.cd}`,{arg:k.id,dis:!ok,cls:ok?'hot':''});});h+=AB('back','back','Back','',{cls:'ghost'})+'</div>';
    }else if(C.step==='target'){h+='<div class="tgt-row"><p class="bhint big">Tap a glowing foe to choose your target.</p>'+AB('back','back','Back','',{cls:'ghost'})+'</div>';}
    else if(C.step==='ally'){const fallen=C.pending.kind==='spell'&&SPELLS[C.pending.key].tgt==='fallen';h+=`<p class="bhint">Choose ${fallen?'a fallen':'an'} ally.</p><div class="apick">`;
      S.party.forEach((q,i)=>{const ok=fallen?q.hp<=0:q.hp>0;h+=`<button data-act="ally" data-arg="${i}" ${ok?'':'disabled'}><img alt="" src="${PORTRAITS[q.cls]}"><b>${esc(q.name.split(' ').pop())}</b><span class="mini-hp"><i style="width:${q.hp/q.maxhp*100}%"></i></span></button>`;});
      h+=`<button class="apick-back" data-act="back">${IC('back')}<b>Back</b></button></div>`;}
    else if(C.step==='item'){h+='<div class="abar">'+AB('item-potion','flask','Potion',`×${S.potions} · +30`,{dis:!S.potions,cls:'primary'})+AB('item-ether','drop','Ether',`×${S.ethers} · +15`,{dis:!S.ethers,cls:'moon'})+AB('back','back','Back','',{cls:'ghost'})+'</div>';}
    else h+='<div class="bwait"><i></i><i></i><i></i></div>';
  }else if(ui.dcast){
    const cst=S.party[ui.dcast.caster],sp=SPELLS[ui.dcast.key];const fallen=sp.tgt==='fallen';
    h+=`<h4>${sp.name}</h4><p class="muted">${esc(cst.name)} casts on…</p><div class="col">`;
    S.party.forEach((q,i)=>{const ok=fallen?q.hp<=0:q.hp>0;h+=B('dtgt',esc(q.name),{dis:!ok,wide:true,r:`${q.hp}/${q.maxhp}`}).replace('data-act="dtgt"',`data-act="dtgt" data-arg="${i}"`);});
    h+='</div><div class="btns">'+B('dback','Back')+'</div>';
  }else if(ui.detail!=null){
    const p=S.party[ui.detail],c=CLASSES[p.cls];
    h+=`<h4>${esc(p.name)} · ${c.title}</h4><div class="stat">
      <span>Level <b>${p.lvl}</b></span><span>XP <b>${p.xp}/${xpNeed(p.lvl)}</b></span>
      <span>HP <b>${p.hp}/${p.maxhp}</b></span><span>SP <b>${p.maxsp?p.sp+'/'+p.maxsp:'—'}</b></span>
      <span>Attack <b>${pAtk(p)}</b></span><span>Armor <b>${pDef(p)}</b></span>
      <span>Speed <b>${Math.floor(p.spd)}</b></span><span>Crit <b>${Math.round(p.crit*100)}%</b></span></div>
      <p class="muted">${GEAR_W[p.w].n} ${c.weapon} · ${GEAR_A[p.a].n} armor${p.spells.length?' · Spells: '+p.spells.map(k=>SPELLS[k].name).join(', '):''}</p><div class="btns">`;
    p.spells.filter(k=>['mend','rekindle'].includes(k)).forEach(k=>{const s=SPELLS[k];h+=B('dcast',`Cast ${s.name}`,{dis:p.hp<=0||p.sp<s.sp,cls:s.school,r:`${s.sp} SP`}).replace('data-act="dcast"',`data-act="dcast" data-arg="${k}"`);});
    h+=B('dpot','Give potion',{dis:!S.potions||p.hp<=0||p.hp>=p.maxhp});
    if(p.maxsp)h+=B('deth','Give ether',{dis:!S.ethers||p.hp<=0||p.sp>=p.maxsp});
    h+=B('leave','Close')+'</div>';
  }else if(ui.menu&&ui.menu!=='npc'){
    const MR=(act,arg,icon,title,sub,price,o={})=>`<button class="mrow ${o.cls||''} ${o.state||''}" data-act="${act}"${arg!=null?` data-arg="${arg}"`:''} ${o.dis?'disabled':''}><span class="mr-ic">${IC(icon)}</span><span class="mr-t"><b>${title}</b>${sub?`<span>${sub}</span>`:''}</span>${price!=null?`<span class="mr-p ${o.dis&&o.state!=='done'?'':'ok'}">${price}</span>`:''}</button>`;
    const head=(t,sub)=>`<div class="mhead"><div><h4>${t}</h4>${sub?`<span>${sub}</span>`:''}</div><span class="mgold">${IC('coin')}${S.gold}</span></div>`;
    const foot=note=>`<div class="mfoot">${note?`<p>${note}</p>`:''}<button class="btn mleave" data-act="leave">${IC('back')}Leave</button></div>`;
    let rows='',h1='',note='';
    if(ui.menu==='inn'){h1=head('The Sleeping Lantern',`A warm room and a hot meal · ${PRICES.inn}g`);
      rows=[['Dawn',6,'sun'],['Noon',12,'sun'],['Dusk',18,'moon'],['Midnight',0,'moon']].map(([n,hr,ic])=>MR('inn',hr,ic,`Wake at ${n}`,`${String(hr).padStart(2,'0')}:00 · full HP and SP`,PRICES.inn+'g',{dis:S.gold<PRICES.inn,cls:ic})).join('');
      note=`The fallen need the temple. Next natural eclipse: noon, day ${Math.ceil((dayOf()+.001)/3)*3}.`;}
    if(ui.menu==='shop'){h1=head('Hammer &amp; Horn Outfitters','Supplies and upgrades');
      rows=MR('buy-potion',null,'flask','Healing potion',`+30 HP · you have ${S.potions}`,PRICES.potion+'g',{dis:S.gold<PRICES.potion})+MR('buy-ether',null,'drop','Ether',`+15 SP · you have ${S.ethers}`,PRICES.ether+'g',{dis:S.gold<PRICES.ether,cls:'moon'});
      S.party.forEach((p,i)=>{const nw=GEAR_W[p.w+1],na=GEAR_A[p.a+1];const c=CLASSES[p.cls];const who=esc(p.name.split(' ').pop());
        if(nw)rows+=MR('buyw',i,p.cls==='ranger'?'bow':'sword',`${nw.n} ${c.weapon}`,`${who} · attack +${nw.b}`,nw.p+'g',{dis:S.gold<nw.p});
        if(na)rows+=MR('buya',i,'shield',`${na.n} armor`,`${who} · armor +${na.b}`,na.p+'g',{dis:S.gold<na.p});});}
    if(ui.menu==='temple'){const miss=S.party.reduce((a,p)=>a+(p.hp>0?p.maxhp-p.hp:0),0),down=S.party.filter(p=>p.hp<=0).length;const hc=Math.ceil(miss/3);
      h1=head('Temple of the Dawn','The sisters tend wounds for a tithe');
      rows=MR('heal',null,'heart','Tend all wounds',miss?`${miss} HP missing across the party`:'Everyone is at full health',miss?hc+'g':'—',{dis:!miss||S.gold<hc,cls:'good'})+MR('revive',null,'sun',`Raise the fallen`,down?`${down} hero${down>1?'es':''} fallen`:'No one has fallen',down?PRICES.revive*down+'g':'—',{dis:!down||S.gold<PRICES.revive*down,cls:'sun'});}
    if(ui.menu==='guild'){h1=head('Guild of the Two Lights','Spells are taught to the caster of their school');
      rows=Object.entries(SPELLS).filter(([k,sp])=>sp.price).map(([k,sp])=>{const who=S.party.find(p=>CLASSES[p.cls].school===sp.school);const known=who.spells.includes(k);const lvlOk=who.lvl>=sp.lvl;const ok=!known&&lvlOk&&S.gold>=sp.price;
        const sub=`${esc(who.name.split(' ').pop())} · ${known?'already known':lvlOk?sp.desc:`needs level ${sp.lvl}`}`;
        return MR('learn',k,sp.school,sp.name,sub,known?'✓':sp.price+'g',{dis:!ok,cls:sp.school,state:known?'done':!lvlOk?'locked':''});}).join('');}
    h+=h1+`<div class="mlist">${rows}</div>`+foot(note);
  }else if(ui.menu==='npc'){
    const [who,text]=LEVELS[S.lvl].npc[ui.arg]||['A stranger','"…"'];h+=`<h4>${esc(who)}</h4><p>${esc(text)}</p><div class="btns">${B('leave','Farewell')}</div>`;
  }else{
    const L=LEVELS[S.lvl];
    h+=`<h4>${L.name}</h4><div class="chips">${skyChips()}</div>`;
    let hint=S.lvl===3?(isDay()?'Birdsong and wind in the leaves. Boars root in the undergrowth. The road home runs west.':'The wood is loud at night. Wisps drift above the reeds by the river.'):L.outdoor?(isDay()?'The streets are safe by daylight. Visit the inn, outfitters, temple and guild, then take the stair in the south-east.':'Wolves prowl the lanes after dark. The windows glow; the inn is still open.'):(isDay()?'Torchlight on old stone. By day the vaults hold rats and bone wardens.':'Night above. The dead walk more freely now, and moon magic runs strong.');
    if(S.lvl===1&&S.flags.sun&&S.flags.moon)hint='Both sigils are yours. The stair down to the Moonspire lies in the south.';
    if(S.lvl===2)hint=S.flags.sun&&S.flags.moon?'The sealed door waits in the south. Beyond it: the altar, and the Regent.':'You feel the sealed door will not open without both sigils.';
    {const t=wxType();if(t!=='under'&&WXT[t].fx)hint=`${WXT[t].icon} ${WXT[t].name}. ${WXT[t].fx}`;}
    h+=`<p>${hint}</p><div class="tiles">${TL('wait','glass','Wait','+1 hour')}${!L.outdoor?TL('camp','tent','Camp','8 h · risky'):''}${TL('save','save','Save','this browser')}</div>`;
    const quest=S.flags.crown?'The crown is won.':!S.flags.sun||!S.flags.moon?`Quest: claim the ${!S.flags.sun&&!S.flags.moon?'Sun and Moon Sigils':!S.flags.sun?'Sun Sigil':'Moon Sigil'} in the Barrow Catacombs.`:'Quest: descend to the Moonspire and break the Umbral Regent.';
    h+=`<p class="muted">${quest}</p>`;
  }
  if(P._h!==h||P.innerHTML===''){P._h=h;P.innerHTML=h;}
}
$('#foes').addEventListener('click',e=>{const b=e.target.closest('.foebar');if(!b||!C)return;const i=+b.dataset.i;if(!C.enemies[i]||!C.enemies[i].alive)return;
  if(C.step==='target')act('tgt',i);else if(C.step==='action'){C.pending={kind:'attack'};doAttack(i);}});
$('#panel').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;act(b.dataset.act,b.dataset.arg);});
export function act(a,arg){
  const n=arg!=null?(isNaN(+arg)?arg:+arg):null;
  if(C&&S.mode==='combat'){
    const p=C.actor!=null?S.party[C.actor]:null;
    switch(a){
      case'attack':C.pending={kind:'attack'};if(C.enemies.filter(e=>e.alive).length===1){doAttack(C.enemies.findIndex(e=>e.alive));return;}C.step='target';break;
      case'castmenu':C.step='spell';break;
      case'skillmenu':C.step='skill';break;
      case'skill':{const k=skillDef(p,n);const live=C.enemies.filter(e=>e.alive);if(k.tgt==='enemy'&&live.length>1){C.pending={kind:'skill',id:n};C.step='target';}else{useSkill(n,C.enemies.findIndex(e=>e.alive));return;}break;}
      case'itemmenu':C.step='item';break;
      case'defend':p.defending=true;log(`${p.name} braces behind a guard.`,'dim');endPlayer();return;
      case'flee':flee();return;
      case'back':C.step='action';C.pending=null;break;
      case'spell':{const s=SPELLS[n];C.pending={kind:'spell',key:n};
        if(s.tgt==='enemy'){if(C.enemies.filter(e=>e.alive).length===1){castSpell(n,C.enemies.findIndex(e=>e.alive));return;}C.step='target';}
        else if(s.tgt==='ally'||s.tgt==='fallen')C.step='ally';else{castSpell(n);return;}break;}
      case'tgt':if(C.pending.kind==='attack')doAttack(n);else if(C.pending.kind==='skill')useSkill(C.pending.id,n);else castSpell(C.pending.key,n);return;
      case'ally':if(C.pending.kind==='spell')castSpell(C.pending.key,n);else useItem(C.pending.item,n);return;
      case'item-potion':C.pending={kind:'item',item:'potion'};C.step='ally';break;
      case'item-ether':C.pending={kind:'item',item:'ether'};C.step='ally';break;
    }
    Bus.emit('hud');return;
  }
  switch(a){
    case'leave':closeMenus();break;
    case'wait':waitHour();return;
    case'camp':camp();return;
    case'save':save(false);return;
    case'inn':S.gold-=PRICES.inn;advanceTo(n);S.party.forEach(p=>{if(p.hp>0){p.hp=p.maxhp;p.sp=p.maxsp;}});log(`The party sleeps soundly and wakes refreshed at ${String(n).padStart(2,'0')}:00.`,'good');sfx('heal');ui.menu=null;save(true);break;
    case'buy-potion':S.gold-=PRICES.potion;S.potions++;sfx('coin');break;
    case'buy-ether':S.gold-=PRICES.ether;S.ethers++;sfx('coin');break;
    case'buyw':{const p=S.party[n];S.gold-=GEAR_W[p.w+1].p;p.w++;log(`${p.name} takes up a ${GEAR_W[p.w].n} ${CLASSES[p.cls].weapon}.`,'gold');sfx('coin');break;}
    case'buya':{const p=S.party[n];S.gold-=GEAR_A[p.a+1].p;p.a++;log(`${p.name} is fitted with ${GEAR_A[p.a].n} armor.`,'gold');sfx('coin');break;}
    case'heal':{const miss=S.party.reduce((s,p)=>s+(p.hp>0?p.maxhp-p.hp:0),0);S.gold-=Math.ceil(miss/3);S.party.forEach(p=>{if(p.hp>0)p.hp=p.maxhp;});log('The sisters close every wound.','good');sfx('heal');break;}
    case'revive':{const down=S.party.filter(p=>p.hp<=0);S.gold-=PRICES.revive*down.length;down.forEach(p=>p.hp=Math.ceil(p.maxhp/2));log(`${down.map(p=>p.name).join(' and ')} ${down.length>1?'are':'is'} called back to the living.`,'good');sfx('level');break;}
    case'learn':{const s=SPELLS[n];const who=S.party.find(p=>CLASSES[p.cls].school===s.school);S.gold-=s.price;who.spells.push(n);log(`${who.name} learns ${s.name}. ${s.desc}`,'gold');sfx('level');break;}
    case'dcast':ui.dcast={caster:ui.detail,key:n};break;
    case'dback':ui.dcast=null;break;
    case'dtgt':castSpell(ui.dcast.key,n);return;
    case'dpot':useItem('potion',ui.detail);return;
    case'deth':useItem('ether',ui.detail);return;
  }
  Bus.emit('hud');
}
