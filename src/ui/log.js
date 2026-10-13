// LOG / UI HELPERS (ported from the single-file build)
import '../core/state.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { $ } from '../core/state.js';
import { camera } from '../render/world.js';
import { IC } from './panels.js';

function logIcon(t,cls){
  if(/^[A-Z][\w ]+: "/.test(t))return'chat';if(/^Tip:/.test(t))return'star';
  if(/Victory/.test(t))return'trophy';if(/destroyed|falls!/.test(t))return'skull';if(/reaches level|learns|training|skill point/i.test(t))return'star';
  if(/misses|dodge|flickers aside|breaks away|cut them off|finds only/.test(t))return'miss';
  if(/spotted|Ambush|ambush|Foes ahead|leap|lunges out|rises from|rear|charge|uproot|step out|claws its way|find you/.test(t))return'alert';
  if(/casts|Spark|Frost|Sunburst|Starfall|Falling Star|Chain Frost|Solar Flare|Ward|Veil|Sanctuary|Radiant|Rekindle|Lightning/.test(t))return cls==='time'?'moon':'sun';
  if(/strikes|lunges|unleashes|snatches|burns|poisoned|webbing|Night Tide|drinks the stolen|darts|snare|starfire|takes \d+ damage/.test(t))return'claw';
  if(/potion|ether|\bHP\b|\bSP\b|heal|restored|recover|wound|berries|sleeps|rekindles|rises again/.test(t))return'heart';
  if(/gold|chest|purse|coin|strongbox/i.test(t))return'coin';
  if(/rain|fog|storm|cloud|sky|overcast|Thunder|sun rises|Night falls|eclipse|ECLIPSE/i.test(t))return cls==='ecl'?'moon':'cloud';
  if(/discover|descend|climb|road|follow|New land|door/i.test(t))return'map';
  if(/saved/i.test(t))return'save';if(/"/.test(t))return'chat';if(/waits|camp/i.test(t))return'glass';
  return{bad:'claw',good:'heart',gold:'star',time:'cloud',ecl:'moon'}[cls]||'map';}
export function log(t,cls=''){const li=document.createElement('li');li.innerHTML=`<span class="li-ic">${IC(logIcon(t,cls))}</span><span class="li-t"></span>`;li.querySelector('.li-t').textContent=t;if(cls)li.className=cls;const L=$('#log');L.prepend(li);while(L.children.length>80)L.lastChild.remove();const tk=$('#ticker');tk.className='';void tk.offsetWidth;tk.textContent=t;tk.className='on '+cls;if(!document.body.classList.contains('tab-log')||document.body.classList.contains('dock-min'))$('#logDot').hidden=false;}
let bannerT=0;export function banner(t){const b=$('#banner');b.textContent=t;b.classList.add('on');clearTimeout(bannerT);bannerT=setTimeout(()=>b.classList.remove('on'),1800);}
export function flash(col){const f=$('#flash');f.style.background=`radial-gradient(ellipse at 50% 45%,${col}aa,${col}00 70%)`;f.style.transition='none';f.style.opacity='1';requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity='0';});}
export function shake(){const v=$('#view');v.classList.remove('shake');void v.offsetWidth;v.classList.add('shake');}
function floatAt(x,y,text,cls){const d=document.createElement('div');d.className='fl '+cls;d.textContent=text;d.style.left=x+'px';d.style.top=y+'px';$('#floats').appendChild(d);setTimeout(()=>d.remove(),1000);}
export function floatWorld(obj,text,cls){const v=obj.position.clone().project(camera);const r=$('#view').getBoundingClientRect();floatAt((v.x+1)/2*r.width,(1-v.y)/2*r.height-20,text,cls);}
export function floatCard(i,text,cls){const c=document.querySelector(`.card[data-i="${i}"]`);const r=$('#view').getBoundingClientRect();if(!c)return;const cr=c.getBoundingClientRect();floatAt(cr.left-r.left+cr.width/2,r.height-24,text,cls);}
