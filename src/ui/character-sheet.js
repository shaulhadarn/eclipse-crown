// CHARACTER SHEET (ported from the single-file build)
import '../core/save.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { CLASSES, GEAR_A, GEAR_W, SKILLS, SPELLS, TIER_COST, TIER_LVL, TRAIN, xpNeed } from '../data/constants.js';
import { $, Bus, S, clamp, has, healMul, isDay, isEclipse, learnSkill, mult, pAtk, pDef, skillState, spCost, spellMul, train, ui } from '../core/state.js';
import { castSpell, useItem } from '../game/combat.js';
import { IC, esc } from './panels.js';
import { PORTRAITS, PORTRAITS_B } from './hud.js';

const HERO={
 knight:{full:'Aldric Vane',title:'Knight of the Dawn Gate',meta:'Age 34 · Hollowmere watch',quote:'Stand behind me. That is the whole plan.',
  bio:'Sworn to the town watch at sixteen, Aldric held the Dawn Gate alone on the night the crown was stolen. He blames himself for the one shadow that slipped past. Now he walks in front, so that no one else has to.',
  traits:[['Vanguard','Foes aim at him far more often than at anyone else.'],['Iron Will','Gains the most health and armor with every level.']]},
 ranger:{full:'Sefa Marrow',title:'Warden of the Greenway',meta:'Age 27 · The woods beyond Hollowmere',quote:'I count every arrow. I get most of them back.',
  bio:'Raised in the forests past the town wall, Sefa tracks by starlight and speaks only when it matters. She has never missed a shot she meant to take, and she keeps count on the inside of her quiver.',
  traits:[['True Aim','Her shots never miss.'],['Keen Eye','One strike in four is a critical hit.']]},
 cleric:{full:'Brother Oren',title:'Keeper of the Temple of the Dawn',meta:'Age 61 · Temple of the Dawn',quote:'The sun is patient. I try to be.',
  bio:'For forty years Oren has tended the temple lamps. His prayers burn brightest at noon and gutter at midnight, so he travels by day and sleeps with a candle lit. He is kinder than he looks, and he looks very kind.',
  traits:[['Sunblessed','Sun spells ×1.5 by day, ×0.7 at night, ×2 in an eclipse.'],['Healer','Mend and Rekindle can be cast outside battle.']]},
 sorc:{full:'Ilyra of the Spire',title:'Moon Sorceress',meta:'Age 22 · Foundling of the Moonspire',quote:'The moon remembers what the sun forgets.',
  bio:'A foundling left in the Moonspire\'s shadow, Ilyra woke on the night the sky was divided with her hair gone white as frost. Moonlight answers her like an old friend. Daylight answers her too, if grudgingly.',
  traits:[['Moontouched','Moon spells ×1.5 by night, ×0.7 by day, ×2 in an eclipse.'],['Starcaller','Can learn Starfall, the strongest single strike.']]}
};
const HERO_BONDS={
 knight:{ranger:'She scouts ahead. He trusts her eyes more than his own.',cleric:'Oren taught him his letters. He still calls him "Master".',sorc:'He does not understand her magic, but he would die for her.'},
 ranger:{knight:'Too loud in the woods. The best shield she has ever had.',cleric:'He leaves her bread at dawn. She pretends not to notice.',sorc:'They share the night watch and trade stories about the stars.'},
 cleric:{knight:'His oldest pupil. Brave to the point of foolishness.',ranger:'A wild thing. The forest raised her well.',sorc:'The moon and the sun, bickering like kin. He is fond of her.'},
 sorc:{knight:'Solid as a wall. She sleeps easier when he keeps watch.',ranger:'The only one who is not afraid of her white hair.',cleric:'He calls moon magic "borrowed light". She lets him.'}};
export const sheet={i:null,pick:null};
export function openSheet(i){sheet.i=i;sheet.pick=null;const el=$('#sheet');el.hidden=false;renderSheet();requestAnimationFrame(()=>el.classList.add('on'));}
export function closeSheet(){const el=$('#sheet');el.classList.remove('on');sheet.i=null;setTimeout(()=>{if(sheet.i==null)el.hidden=true;},250);}
function radarSVG(p){
  const ax=[['Attack',pAtk(p)/32],['Armor',pDef(p)/22],['Speed',p.spd/13],['Critical',p.crit/.42],['Vitality',p.maxhp/180],['Magic',p.maxsp?(p.maxsp/110)*(spellMul(p,CLASSES[p.cls].school||'sun')/Math.max(.7,mult(CLASSES[p.cls].school||'sun'))):0]];
  const cx=110,cy=104,R=70,n=ax.length;const pt=(i,r)=>{const a=-Math.PI/2+i/n*Math.PI*2;return[cx+Math.cos(a)*R*r,cy+Math.sin(a)*R*r];};
  let g='';[.25,.5,.75,1].forEach(r=>{g+=`<polygon points="${ax.map((_,i)=>pt(i,r).join(',')).join(' ')}" fill="none" stroke="#3b3527" stroke-width="1"/>`;});
  ax.forEach((a,i)=>{const [x,y]=pt(i,1);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#3b3527"/>`;const [lx,ly]=pt(i,1.24);g+=`<text x="${lx}" y="${ly+4}" text-anchor="middle" font-size="11" fill="#8e94a4" font-family="Alegreya Sans, sans-serif">${a[0]}</text>`;});
  ax.forEach(a=>a[1]=Math.sqrt(clamp(a[1],0,1)));const poly=ax.map((a,i)=>pt(i,clamp(a[1],.04,1)).join(',')).join(' ');
  g+=`<polygon points="${poly}" fill="rgba(232,193,112,.22)" stroke="#e8c170" stroke-width="2" stroke-linejoin="round"/>`;
  ax.forEach((a,i)=>{const [x,y]=pt(i,clamp(a[1],.04,1));g+=`<circle cx="${x}" cy="${y}" r="3" fill="#e8c170"/>`;});
  return`<svg class="radar" viewBox="0 0 220 208" role="img" aria-label="Attribute profile">${g}</svg>`;
}
export function renderSheet(){
  if(sheet.i==null||!S)return;const p=S.party[sheet.i],c=CLASSES[p.cls],H=HERO[p.cls];sheet.tab=sheet.tab||'overview';
  const need=xpNeed(p.lvl),pct=p.xp/need,C2=2*Math.PI*28;
  const wpn=GEAR_W[p.w],arm=GEAR_A[p.a],nw=GEAR_W[p.w+1],na=GEAR_A[p.a+1];
  const bar=(v,m,cls)=>`<div class="bar ${cls}"><i style="width:${m?Math.max(0,v/m*100):0}%"></i></div>`;
  const tier=n=>`<span class="tier">${[0,1,2,3].map(k=>`<i class="${k<=n?'on':''}"></i>`).join('')}</span>`;
  const school=c.school;const atk=pAtk(p);
  const tabs=[['overview','Overview',0],['train','Training',p.ap],['skills','Skills',p.skp],['story','Story',0]];
  // ---------- tab bodies ----------
  let body='';
  if(sheet.tab==='overview'){
    const known=p.spells.map(k=>{const sp=SPELLS[k];const pw=sp.pow?Math.round(sp.pow(p.lvl)*spellMul(p,sp.school)):sp.heal?Math.round(sp.heal(p.lvl)*healMul(p)):null;
      return`<div class="spell ${sp.school}">${IC(sp.school)}<div><b>${sp.name}</b><span>${sp.desc}</span></div><div class="r">${spCost(p,sp)} SP${pw!=null?`<small>${sp.heal?'heals':'power'} ${pw} now</small>`:''}</div></div>`;}).join('');
    const actSk=SKILLS[p.cls].filter(k=>has(p,k.id));
    const castable=p.spells.filter(k=>k==='mend'||k==='rekindle');
    let acts='';
    if(sheet.pick){const sp=SPELLS[sheet.pick];const fallen=sp.tgt==='fallen';
      acts=`<p class="muted-note">Cast ${sp.name} on:</p><div class="sh-pick">${S.party.map((q,j)=>`<button data-sa="tgt" data-arg="${j}" ${(fallen?q.hp>0:q.hp<=0)?'disabled':''}><img alt="" src="${PORTRAITS[q.cls]}">${esc(q.name.split(' ').pop())}</button>`).join('')}</div><div class="sh-acts"><button class="btn" data-sa="cancel">Cancel</button></div>`;}
    else{acts='<div class="sh-acts">'+castable.map(k=>{const sp=SPELLS[k];return`<button class="btn sun" data-sa="cast" data-arg="${k}" ${p.hp<=0||p.sp<sp.sp||S.mode!=='explore'?'disabled':''}>${IC('sun')}Cast ${sp.name}<span class="r">${sp.sp} SP</span></button>`;}).join('')
      +`<button class="btn" data-sa="pot" ${!S.potions||p.hp<=0||p.hp>=p.maxhp||S.mode!=='explore'?'disabled':''}>${IC('flask')}Give potion<span class="r">×${S.potions}</span></button>`
      +(p.maxsp?`<button class="btn moon" data-sa="eth" ${!S.ethers||p.hp<=0||p.sp>=p.maxsp||S.mode!=='explore'?'disabled':''}>${IC('drop')}Give ether<span class="r">×${S.ethers}</span></button>`:'')+'</div>';}
    const dmgLo=Math.round(atk*(has(p,'dawn')&&isDay()?1.3:1)*(has(p,'night')&&!isDay()?1.35:1)),dmgHi=Math.round(dmgLo*1.6);
    const read=[['Strike',`${dmgLo}–${dmgHi}`,'before foe armor'],['Critical',`${Math.round(p.crit*100)}%`,'×1.8 damage'],['Hit chance',p.cls==='ranger'?'100%':'92%',p.cls==='ranger'?'True Aim':'melee'],
      school?['Spell power',`×${spellMul(p,school).toFixed(2)}`,isEclipse()?'eclipse':isDay()?'daylight':'night']:['Guard','×0.5','when defending'],['Armor',pDef(p),'reduces each hit'],['Turn order',`#${[...S.party].sort((a,b)=>b.spd-a.spd).indexOf(p)+1} of 4`,`speed ${Math.floor(p.spd)}`]];
    body=`<div class="tgrid ov-grid"><div class="ov-col">
      <section class="sh-card"><h3>Vitals</h3><div class="vit">
        <div class="row"><span>HP</span>${bar(p.hp,p.maxhp,'hp')}<b>${p.hp}/${p.maxhp}</b></div>
        ${p.maxsp?`<div class="row"><span>SP</span>${bar(p.sp,p.maxsp,'sp')}<b>${p.sp}/${p.maxsp}</b></div>`:''}
        <div class="row"><span>XP</span>${bar(p.xp,need,'xpb')}<b>${p.xp}/${need}</b></div></div>
        ${p.hp<=0?'<p class="muted-note">Fallen. Raise at the temple or with Rekindle.</p>':''}</section>
      <section class="sh-card"><h3>In battle</h3><div class="readout">${read.map(r=>`<div><span>${r[0]}</span><b>${r[1]}</b><em>${r[2]}</em></div>`).join('')}</div></section>
      <section class="sh-card"><h3>Equipment</h3><div class="gear">
        <div class="slot">${IC(p.cls==='ranger'?'bow':'sword')}<div><b>${wpn.n} ${c.weapon}</b><span>Attack +${wpn.b}${nw?` · next: ${nw.n}, ${nw.p}g`:' · finest made'}</span>${tier(p.w)}</div></div>
        <div class="slot">${IC('shield')}<div><b>${arm.n} armor</b><span>Armor +${arm.b}${na?` · next: ${na.n}, ${na.p}g`:' · finest made'}</span>${tier(p.a)}</div></div></div></section>
      <section class="sh-card grow"><h3>Use</h3>${acts}</section>
    </div><div class="ov-col">
      <section class="sh-card radar-card"><h3>Profile</h3>${radarSVG(p)}</section>
      ${p.spells.length?`<section class="sh-card"><h3>Spells · ${p.spells.length}</h3><div class="spells compact ${p.spells.length>3?'two':''}">${p.spells.map(k=>{const sp=SPELLS[k];const pw=sp.pow?Math.round(sp.pow(p.lvl)*spellMul(p,sp.school)):sp.heal?Math.round(sp.heal(p.lvl)*healMul(p)):null;
        return`<div class="spc ${sp.school}" title="${esc(sp.desc)}">${IC(sp.school)}<b>${sp.name}</b><span>${pw!=null?(sp.heal?'+'+pw:pw):'—'}</span><em>${spCost(p,sp)} SP</em></div>`;}).join('')}</div></section>`:''}
      <section class="sh-card grow"><h3>Abilities</h3>${actSk.length?`<div class="chips2">${actSk.map(k=>`<span class="${k.act?'act':''}">${esc(k.name)}</span>`).join('')}</div>`:`<p class="muted-note">No skills learned yet.${p.skp?` You have ${p.skp} skill point${p.skp>1?'s':''} to spend in the Skills tab.`:''}</p>`}
        <div class="trait-line">${H.traits.map(([n,d])=>`<span title="${esc(d)}">${n}</span>`).join('')}</div></section>
    </div></div>`;
  }
  if(sheet.tab==='train'){
    const g=c.grow,nl=p.lvl+1,unlock=TIER_LVL.indexOf(nl);
    const now={mig:`Attack ${atk}`,vit:`Max HP ${p.maxhp}`,agi:`Speed ${p.spd.toFixed(1)} · Crit ${Math.round(p.crit*100)}%`,spi:p.maxsp?`Max SP ${p.maxsp} · Power ×${(1+p.alloc.spi*.03).toFixed(2)}`:''};
    const spent=Object.values(p.alloc).reduce((a,b)=>a+b,0);
    body=`<div class="tgrid ov-grid"><div class="ov-col">
      <section class="sh-card grow"><div class="tab-head"><h3>Training</h3><span class="ptbig">${p.ap}<small>point${p.ap===1?'':'s'} to spend</small></span></div>
        <div class="train one">${Object.entries(TRAIN).map(([k,t])=>{const no=k==='spi'&&!p.maxsp;return`<div class="tr"><b>${t.name}<small>${p.alloc[k]?'+'+p.alloc[k]:''}</small></b><span>${no?'Only spellcasters train Spirit':`${t.desc} · now ${now[k]}`}</span><button data-sa="train" data-arg="${k}" aria-label="Train ${t.name}" ${p.ap<1||no?'disabled':''}>+</button></div>`;}).join('')}</div>
        <p class="muted-note" style="margin-top:10px">Training is permanent. Each level grants 3 training points and 1 skill point.</p></section>
    </div><div class="ov-col">
      <section class="sh-card"><h3>Next level · ${nl}</h3><div class="vit"><div class="row"><span>XP</span>${bar(p.xp,need,'xpb')}<b>${need-p.xp} to go</b></div></div>
        <div class="gains">${[['Max HP',`+${g.hp}`],g.sp?['Max SP',`+${g.sp}`]:null,['Attack',`+${g.atk}`],['Armor',`+${g.def}`],g.spd?['Speed',`+${g.spd}`]:null,['Training','+3 points'],['Skills','+1 point']].filter(Boolean).map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>
        ${unlock>0?`<p class="unlock">Reaching level ${nl} unlocks <b>Tier ${['','I','II','III'][unlock]}</b> skills.</p>`:''}</section>
      <section class="sh-card grow"><h3>Training record</h3><div class="alloc">${Object.entries(TRAIN).map(([k,t])=>`<div class="al-row"><span>${t.name}</span><div class="pips"><i style="width:${Math.min(100,p.alloc[k]*10)}%"></i></div><b>+${p.alloc[k]}</b></div>`).join('')}</div>
        <p class="muted-note" style="margin-top:10px">${spent?`${spent} point${spent>1?'s':''} invested so far.`:'No training yet. Level up by winning battles, opening chests, claiming sigils and discovering new lands.'}</p></section>
    </div></div>`;
  }
  if(sheet.tab==='skills'){
    const learned=SKILLS[p.cls].filter(k=>has(p,k.id));
    body=`<div class="tgrid one"><section class="sh-card grow"><div class="tab-head"><h3>Skill tree</h3><span class="ptbig skill">${p.skp}<small>point${p.skp===1?'':'s'} to spend</small></span></div><div class="tree fill">${[1,2,3].map(t=>`<div class="tier-row"><div class="tier-lab">Tier ${['','I','II','III'][t]}<small>Lv ${TIER_LVL[t]}${TIER_COST[t]>1?' · 2 pts':''}</small></div><div class="tier-skills">${SKILLS[p.cls].filter(k=>k.tier===t).map(k=>{const st=skillState(p,k);const msg={learned:'✓ Learned',ready:`Learn · ${TIER_COST[k.tier]} point${TIER_COST[k.tier]>1?'s':''}`,level:`Requires level ${TIER_LVL[k.tier]}`,prereq:'Learn a skill from the tier above first',points:`Needs ${TIER_COST[k.tier]} skill point${TIER_COST[k.tier]>1?'s':''}`}[st];
        return`<${st==='ready'?'button':'div'} class="sk ${st==='learned'?'learned':st==='ready'?'ready':'locked'}" ${st==='ready'?`data-sa="learn" data-arg="${k.id}"`:''}><span class="nm">${esc(k.name)}<span class="ty ${k.act?'act':''}">${k.act?(k.sp?k.sp+' SP':'cd '+k.cd):'Passive'}</span></span><span class="ds">${esc(k.desc)}</span><span class="st">${msg}</span></${st==='ready'?'button':'div'}>`;}).join('')}</div></div>`).join('')}</div></section>
      <section class="sh-card"><h3>Loadout · ${learned.length} of 6</h3>${learned.length?`<div class="chips2">${learned.map(k=>`<span class="${k.act?'act':''}">${esc(k.name)}${k.act?' · battle':' · passive'}</span>`).join('')}</div>`:'<p class="muted-note">Nothing learned yet.</p>'}
        <p class="muted-note" style="margin-top:8px">Active skills appear under Skills in battle. Passive skills work all the time.</p></section></div>`;
  }
  if(sheet.tab==='story'){
    const bonds=HERO_BONDS[p.cls]||{};
    body=`<div class="tgrid ov-grid"><div class="ov-col">
      <section class="sh-card story grow"><h3>${esc(H.title)}</h3><blockquote>${esc(H.quote)}</blockquote><p class="bio">${esc(H.bio)}</p>
        <div class="facts">${[['Home',H.meta.split(' · ')[1]||'—'],['Age',(H.meta.split(' · ')[0]||'').replace('Age ','')],['Weapon',c.weapon],['Magic',c.school?(c.school==='sun'?'Sun':'Moon'):'None']].map(([a,b])=>`<div><span>${a}</span><b>${esc(b)}</b></div>`).join('')}</div></section>
    </div><div class="ov-col">
      <section class="sh-card"><h3>Traits</h3><div class="trait-mini">${H.traits.map(([n,d])=>`<div><b>${n}</b><span>${d}</span></div>`).join('')}</div></section>
      <section class="sh-card grow"><h3>Bonds</h3><div class="bonds">${S.party.filter(q=>q.cls!==p.cls).map(q=>`<div><img alt="" src="${PORTRAITS[q.cls]}"><div><b>${esc(q.name)}</b><span>${esc(bonds[q.cls]||'')}</span></div></div>`).join('')}</div></section>
    </div></div>`;
  }
  $('#sheet').innerHTML=`<div class="sh">
   <header class="sh-top">
     <button class="sh-back" data-sa="close">${IC('back')}<span>Back to game</span></button>
     <div class="sh-switch" role="tablist" aria-label="Choose hero">${S.party.map((q,j)=>`<button data-sa="hero" data-arg="${j}" class="${j===sheet.i?'on':''}" aria-label="${esc(q.name)}"><img alt="" src="${PORTRAITS[q.cls]}">${(q.ap||q.skp)?'<i></i>':''}</button>`).join('')}</div>
   </header>
   <div class="sh-hero live" data-cls="${p.cls}"><img alt="Portrait of ${esc(H.full)}" src="${PORTRAITS[p.cls]}"><img class="blk" alt="" src="${PORTRAITS_B[p.cls]}"><span class="fx"></span>
    <div class="sh-lvl"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#0c0e14cc" stroke="#2a2f3c" stroke-width="4"/><circle cx="32" cy="32" r="28" fill="none" stroke="#e8c170" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C2}" stroke-dashoffset="${C2*(1-pct)}"/></svg><b><span><small>LEVEL</small>${p.lvl}</span></b></div>
    <div class="sh-plate"><div class="cls">${c.title}</div><h2>${esc(H.full)}</h2><div class="sub">${esc(H.title)}</div><q>${esc(H.quote)}</q></div></div>
   <div class="sh-body">
    <nav class="sh-tabs" role="tablist">${tabs.map(([k,l,b])=>`<button role="tab" aria-selected="${sheet.tab===k}" class="${sheet.tab===k?'on':''}" data-sa="tab" data-arg="${k}">${l}${b?`<i>${b}</i>`:''}</button>`).join('')}</nav>
    <div class="tabc">${body}</div>
   </div>
   <footer class="sh-foot"><button class="btn primary-back" data-sa="close">${IC('back')}Back to game</button></footer>
  </div>`;
}
$('#sheet').addEventListener('click',e=>{
  if(e.target.id==='sheet'){closeSheet();return;}
  const b=e.target.closest('[data-sa]');if(!b||b.disabled)return;const a=b.dataset.sa,arg=b.dataset.arg;const n=S.party.length;
  if(a==='close')return closeSheet();
  if(a==='tab'){sheet.tab=arg;sheet.pick=null;const sh=document.querySelector('.sh');renderSheet();Bus.emit('hud');const b2=document.querySelector('.sh-body');if(b2&&innerWidth<=760)b2.scrollIntoView({block:'start'});return;}
  if(a==='hero'){sheet.i=+arg;sheet.pick=null;}
  if(a==='prev'){sheet.i=(sheet.i+n-1)%n;sheet.pick=null;}
  else if(a==='next'){sheet.i=(sheet.i+1)%n;sheet.pick=null;}
  else if(a==='cast')sheet.pick=arg;
  else if(a==='cancel')sheet.pick=null;
  else if(a==='tgt'){ui.dcast={caster:sheet.i,key:sheet.pick};sheet.pick=null;castSpell(ui.dcast.key,+arg);}
  else if(a==='train')train(S.party[sheet.i],arg);
  else if(a==='learn')learnSkill(S.party[sheet.i],arg);
  else if(a==='pot')useItem('potion',sheet.i);
  else if(a==='eth')useItem('ether',sheet.i);
  renderSheet();Bus.emit('hud');
});
let shTouch=null;$('#sheet').addEventListener('touchstart',e=>{if(e.target.closest('.sh-hero'))shTouch=e.touches[0].clientX;},{passive:true});
$('#sheet').addEventListener('touchend',e=>{if(shTouch==null)return;const dx=e.changedTouches[0].clientX-shTouch;shTouch=null;if(Math.abs(dx)>50){const n=S.party.length;sheet.i=(sheet.i+(dx<0?1:n-1))%n;sheet.pick=null;renderSheet();}},{passive:true});
Bus.on('hud',()=>{if(sheet.i!=null)renderSheet();});
