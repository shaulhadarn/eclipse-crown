// RELICS: finding and wearing them. The relic data and bonus rules live in data/relics.ts.
import { CHEST_RELICS, FOE_RELICS, RELICS, describeFace, nextUnfound } from '../data/relics';
import { Bus, S, rb } from '../core/state.js';
import { banner, flash, floatCard, log } from '../ui/log.js';
import { sfx } from '../audio/audio.js';

// saves from before relics have no satchel
export const owned=()=>S.relics||(S.relics=[]);
export const wearer=id=>S.party.findIndex(p=>p.relic===id);

export function grantRelic(id){
  if(!id||!RELICS[id]||owned().includes(id))return false;
  const r=RELICS[id];owned().push(id);
  banner(`Relic found · ${r.name}`);flash('#b8a4ff');sfx('level');
  log(`Relic found: ${r.name}. ${r.lore}`,'gold');
  log(`By day: ${describeFace(r.sun)}. By night: ${describeFace(r.moon)}. In an eclipse, both.`,'time');
  // the first relic goes straight onto the first hero without one, so it is felt at once
  const free=S.party.findIndex(p=>!p.relic);
  if(owned().length===1&&free>=0){S.party[free].relic=id;log(`${S.party[free].name} takes up the ${r.name}. Open a hero's sheet and choose Relics to change who wears what.`,'gold');}
  Bus.emit('hud');return true;
}

/** A chest gives the next relic from its level's hoard, if any are left there. */
export const chestRelic=()=>grantRelic(nextUnfound(CHEST_RELICS[S.lvl]||[],owned()));

/** Dread champions always carry a relic while any are left; ordinary foes rarely do. */
export function foeRelic(elite){
  if(!elite&&Math.random()>=.05)return false;
  return grantRelic(nextUnfound(FOE_RELICS,owned()));
}

/** Puts a relic on a hero, taking it off whoever wore it. Passing the worn relic removes it. */
export function equipRelic(i,id){
  const p=S.party[i];if(!p||!owned().includes(id))return;
  if(p.relic===id){p.relic=null;log(`${p.name} sets aside the ${RELICS[id].name}.`,'dim');sfx('coin');return;}
  const w=wearer(id);if(w>=0)S.party[w].relic=null;
  p.relic=id;log(`${p.name} takes up the ${RELICS[id].name}.`,'gold');sfx('coin');
}

/** Start of each battle round: relics that mend or restore do so for the living. */
export function relicRound(){
  S.party.forEach((p,i)=>{if(p.hp<=0||!p.relic)return;
    const h=Math.min(rb(p,'regen'),p.maxhp-p.hp);if(h>0){p.hp+=h;floatCard(i,'+'+h,'heal');}
    const m=Math.min(rb(p,'sp'),p.maxsp-p.sp);if(m>0)p.sp+=m;});
}
