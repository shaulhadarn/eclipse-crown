// SAGA: story, journal, lore, banter (ported from the single-file build)
import './prologue.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { LEVELS } from '../data/constants.js';
import { $, Bus, S, giveXP, isDay, ri } from '../core/state.js';
import { banner, log } from '../ui/log.js';
import { Au, sfx } from '../audio/audio.js';
import { monImg } from '../render/textures.js';
import { MV, SRGB, dyn, glowSprite, hash2, pixTex, sprite, world } from '../render/world.js';
import { IC, esc } from '../ui/panels.js';
import { PORTRAITS } from '../ui/hud.js';
import { sheet } from '../ui/character-sheet.js';
import { chord, intro } from './prologue.js';
import { BAR_COUNT, barIndex, heldBars, scheduleNocturne } from './nocturne';

const SPK={A:{n:'Aldric',c:'knight'},S:{n:'Sefa',c:'ranger'},O:{n:'Brother Oren',c:'cleric'},I:{n:'Ilyra',c:'sorc'},
  R:{n:'The Umbral Regent',m:'regent'},K:{n:'Caedmon',m:'regent'},N:{n:''},P:{n:''}};
export const SCENES={
 arrive:[['N','Hollowmere, morning. The lamps are still lit, though the sun is up. No one here trusts the light to stay.'],
  ['A','The crown was taken on my watch. I mean to bring it back before the town forgets what a whole sky looks like.'],
  ['S','Then we stop talking at the gate. Outfitters first. You are not walking into a barrow in that coat.'],
  ['O','And the temple, and the guild. Sun magic burns hottest at noon, children. Plan our fights by the dial.'],
  ['I','And mine after dark. Between the two of us, Brother, there is no hour when the Regent is safe.']],
 enter1:[['N','The stair ends in cold air and the smell of old candles. Somewhere below, water drips onto stone.'],
  ['O','The Barrow. My order buried its priests here long before the Regent came. Tread gently near the sun-marked tombs.'],
  ['S','Tracks. Rats, many of them. Something heavier too, and it drags one foot.'],
  ['I','Two vaults lie to the south. I can feel them. One is warm, and one is very cold.']],
 sun:[['N','The Sun Sigil hums in Oren\'s hands like a struck bell that will not fall silent.'],
  ['O','My order made this. Half a key. It was never meant to be held without the other half.']],
 moon:[['N','Frost creeps across the Moon Sigil. Ilyra\'s breath clouds the air between you.'],
  ['I','It knows me. That should frighten me more than it does.']],
 both:[['N','Sun and moon, side by side in one pack. For a moment the torchlight turns a colour that has no name.'],
  ['A','Both halves. Now we go down.'],
  ['I','There is an altar in the Moonspire. With these we can make our own eclipse. We will not have to wait for the sky.']],
 enter2:[['N','The Moonspire turns its crystal walls inward. Your torches burn violet here, and your shadows walk a step behind you.'],
  ['I','I was left on the steps of this tower as a baby. I have never been inside.'],
  ['A','Stay close to me, then.'],
  ['I','Aldric. In here, I am the one who keeps you alive.'],
  ['S','Both of you, hush. Something up ahead is listening.']],
 enter3:[['N','The road gives way to wild green. Birdsong, and beneath it, the creak of trees that should not be moving.'],
  ['S','Home, or close enough. Mind where you step. The wood remembers everyone who has ever cut it.'],
  ['O','There is a stone circle somewhere out here. Old Tamsin swears by it.']],
 door:[['N','The sockets drink the sigils. Gears older than Hollowmere turn, and the sealed door groans open onto a hall of black glass.'],
  ['O','Beyond this lies the altar. And beyond that, him.']],
 boss:[['N','At the foot of the altar, a figure in a cloak the colour of dusk turns to face you. The Crown sits on his brow, half gold and half silver.'],
  ['R','Aldric of the Dawn Gate. You let me pass once. Will you let me pass again?'],
  ['A','That voice... Steward Caedmon?'],
  ['R','Thirty years I held this crown in trust and watched others live under the light it gave. One eclipse, and I took both lights for myself.'],
  ['O','And they burned you hollow. Give it back, Caedmon. There is still a man in there.'],
  ['R','There is only the dark between them now. Come and take it.'],
  ['I','He cannot be wounded while the sky is divided. Strike when sun and moon share the sky, or kindle the eclipse at the altar.']],
 eclipse:[['N','The moon slides across the sun. Hollowmere falls silent, and every flame in the realm leans the same way.'],
  ['I','Do you feel that? Everything is doubled. This is the hour to strike.']],
 night1:[['N','Dusk. One by one the windows of the town catch fire, and the shadows between them grow teeth.'],
  ['S','Wolves on the wind, and worse in the catacombs. Stay in the light, or make good use of the dark.'],
  ['I','Night is mine. Let me lead for a while.']],
 win1:[['A','Everyone standing? Good.'],
  ['S','Every fight teaches us something. When a portrait glows, tap it and spend what we learned.']],
 oath:[['N','The twelve pages lie open on the altar steps. Their margins were never a scholar\'s notes. They are music, and together they make one piece.'],
  ['I','Caedmon. You wrote the oath. Listen to it.'],
  ['N','The melody climbs, stumbles where the pages were torn, and finds its way home.'],
  ['R','I know this. We sang it at the stone circle, every eclipse. Before I...'],
  ['A','You held the Dawn Gate beside me once, Steward. Hold it now. Put the crown down.'],
  ['R','Both lights. I only wanted to keep them both.'],
  ['O','No one can. That was the whole point of the oath.'],
  ['N','With shaking hands, Caedmon lifts the Crown from his brow and sets it on the altar. The dusk drains out of his cloak.']],
 spared:[['N','The Crown rests on the altar between sun and moon. Beside it kneels an old man in a steward\'s coat, alive.'],
  ['K','I wrote that oath with my own hand, and I forgot every bar of it. Thank you for remembering.'],
  ['S','So, not a monster after all. Just a man who could not let go.'],
  ['O','Come home, Caedmon. Tamsin still keeps the circle. She will want to hear it played again.'],
  ['I','Vess always said the work was to mend, not to break. I think she would have liked this ending.'],
  ['A','Then we take them both home. The crown, and him.']],
 crown:[['N','The Regent comes apart like smoke in the wind. What is left is an old man in a steward\'s coat, and then not even that.'],
  ['A','It is done.'],
  ['O','Rest now, Caedmon. Both lights forgive you, even if we cannot yet.'],
  ['I','Listen. The sky. It is letting go.'],
  ['S','Then let\'s take the crown home.']]
};
const LORE=[
 [['The Lamplighter\'s Ledger','Every lamp in Hollowmere is lit from one flame, carried down from the Moonspire on the night the Crown was forged. Maren\'s family has kept it burning for nine generations. She will not say what happens if it goes out.'],
  ['A Faded Proclamation','BY ORDER OF THE STEWARD: the Crown of Two Lights shall be worn by no king. It is held in trust for the realm, and the Steward alone shall guard it. Sealed, Caedmon, Steward of Hollowmere.'],
  ['A Child\'s Skipping Rhyme','Sun for the reaper, moon for the tide, / Caedmon went walking with both at his side. / He wore the crown when the sky went black. / Ring the bell thrice, he won\'t come back.']],
 [['A Pilgrim\'s Diary','Fourth day below. The wights do not attack the old sun-priests\' tombs. They kneel there. Whatever the Regent made of them, some part still remembers what they swore.'],
  ['Rite of the Dawn Order','The Sun Sigil is half of a key, never a weapon. Our order and the Moon Circle forged the Crown together so that neither could wield it alone. Brother, if you are reading this, the circle has been broken.'],
  ['Scratched Into the Vault Wall','CAEDMON LIED. HE WORE IT AT THE ECLIPSE. HE WANTED BOTH LIGHTS. NOW HE IS NEITHER.']],
 [['A Letter to Ilyra','Ilyra, if the spire has taken me, do not mourn me. Finish the work. The Regent\'s ward is woven from the divided sky. A mind of the moon and a heart of the sun, joined, can unpick it. Your teacher, Vess.'],
  ['The Herald\'s Confession','I carried his banner for forty years. He promised the realm an endless noon and a gentle endless night, both at once. What he made was the dark between them.'],
  ['Inscription on the Altar','Two sigils placed, one sky made. Hold the eclipse in your hands and the Regent is only a man again, for as long as the dark lasts.']],
 [['A Ranger\'s Waymark','Cut in the old ranger-script Sefa learned as a child: THE STEWARD PASSED THIS WAY BY NIGHT, ALONE, WITH A BUNDLE THAT GLOWED TWO COLOURS. HE DID NOT LOOK LIKE A THIEF. HE LOOKED LIKE A MAN GOING HOME.'],
  ['Tamsin\'s Notes','Both orders once met at the stone circle every eclipse to renew their oath. Since the theft, only I come. The stones are lonely, and so am I.'],
  ['A Burned Page','...should the Crown ever be worn at the eclipse, the bearer holds both lights and is held by them. The orders swore never to allow it. It was Caedmon himself who wrote the oath.']]
];
const LORE_N=LORE.reduce((a,l)=>a+l.length,0);
// place pages far from stairs and roads, spread apart (deterministic, from the original maps)
const LORE_POS=LEVELS.map((L,li)=>{const cand=[],set=[];L.map.forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='.'||(L.outdoor&&c===','))cand.push([x,y]);if('@<>='.includes(c))set.push([x,y]);}));
  const out=[];for(let k=0;k<LORE[li].length;k++){let best=null,bd=-1;for(const p of cand){if(out.some(q=>q[0]===p[0]&&q[1]===p[1]))continue;let d=1e9;for(const q of set)d=Math.min(d,Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1]));d+=hash2(p[0],p[1],li)*.9;if(d>bd){bd=d;best=p;}}if(best){out.push(best);set.push(best);}}return out;});
const BARKS={
 town:[['O','Smell that? Fresh bread. When this is over, I am buying the whole bakery.'],['S','Too many walls. In a town I can never see the sky properly.'],['A','The watch used to march this lane at dawn. It is quieter now.']],
 townN:[['I','The lamps keep the wolves out of the square. Mostly.'],['S','Something small is following us. Probably a thief. Keep a hand on your purse.'],['O','It is late. I should have lit my candle by now.']],
 cata:[['O','Mind the sun-marked tombs. Those are my brothers.'],['S','The air is moving. There is another way through here.'],['A','I hate tight halls. Nowhere to swing.'],['I','The dead here are restless, not angry. There is a difference.']],
 spire:[['I','The walls are singing. Can none of you hear it?'],['A','My torch is burning purple. I do not like that.'],['O','Even my prayers echo strangely in this place.']],
 wild:[['S','Boar tracks, fresh. Dinner, if we are lucky.'],['O','My knees were not made for roots.'],['I','The wisps are only lost lights. I almost pity them.'],['A','Open sky. I had forgotten how big it is.']],
 rain:[['S','Rain hides our tracks. Theirs too.'],['O','Good for the barley. Bad for my bones.']],
 storm:[['A','Steel and lightning. Give me some room for a moment.'],['I','That storm has more magic in it than I do.']],
 fog:[['S','Fog. Stay close, and stay quiet.']],
 hurt:[['O','We are hurt. A potion or the temple, before the next fight.']]
};
function curChapter(){const v=S.visited||{0:1},f=S.flags;if(!v[1])return 0;if(!(f.sun&&f.moon))return 1;if(!v[2]||!doorOpen())return 2;if(!f.crown)return 3;return 4;}
const doorOpen=()=>!S.maps[2].some(r=>r.includes('K'));
const CHAPTERS=[['I','The Lamplit Town','Prepare in Hollowmere, then take the stair below.'],['II','Twin Vaults of the Barrow','One vault opens by sun, the other by moon.'],['III','The Moonspire','Bear both sigils to the sealed door.'],['IV','The Divided Sky','Face the Regent when the sky is one.'],['V','Epilogue','The Crown returns to Hollowmere.']];
function chapterGoals(){const v=S.visited||{0:1},f=S.flags,n=Object.keys(ST().lore).length;return[
 [['Descend the stair into the Barrow Catacombs',!!v[1]]],
 [['Claim the Sun Sigil (the gilded gate opens by day)',f.sun],['Claim the Moon Sigil (the silver gate opens by night)',f.moon]],
 [['Descend into the Moonspire',!!v[2]],['Open the sealed door with both sigils',doorOpen()]],
 [['Defeat the Umbral Regent at the eclipse',f.crown]],
 [['The chronicle is complete. The realm is yours to wander.',true]],
 [['Explore the Wildwood east of town',!!v[3]],[`Recover the lost pages (${n} of ${LORE_N})`,n>=LORE_N]]];}
export function ST(){if(!S.story){const v=S.visited||{};S.story={seen:{arrive:1,night1:1,win1:1},lore:{},ch:curChapterSafe(),steps:0,lastBark:0};[1,2,3].forEach(l=>{if(v[l])S.story.seen['enter'+l]=1;});if(S.flags.sun)S.story.seen.sun=1;if(S.flags.moon)S.story.seen.moon=1;if(S.flags.sun&&S.flags.moon)S.story.seen.both=1;}return S.story;}
function curChapterSafe(){try{return curChapter();}catch(e){return 0;}}

export const saga={on:false,q:[],tok:0};
const sagaReady=()=>S&&S.mode==='explore'&&!intro.active&&$('#intro').hidden&&$('#overlay').hidden&&sheet.i==null&&$('#journal').hidden;
export function sagaPush(job){saga.q.push(job);sagaPump();}
function sagaPump(){if(saga.on||!saga.q.length||!sagaReady())return;const j=saga.q.shift();saga.on=true;MV.q=null;document.body.classList.add('saga');const tok=++saga.tok;
  j(()=>{if(tok!==saga.tok)return;saga.on=false;if(!saga.q.length)document.body.classList.remove('saga');Bus.emit('hud');setTimeout(sagaPump,220);});}
export function story(id,after){const st=ST();if(st.seen[id]||!SCENES[id]){after&&after();return;}st.seen[id]=1;sagaPush(done=>playScene(SCENES[id],()=>{done();after&&after();}));}
export function chapterCheck(){if(!S||intro.active||!$('#intro').hidden||!$('#overlay').hidden)return;const st=ST(),ch=curChapter();if(ch>st.ch){st.ch=ch;sagaPush(done=>titleCard('chapter',`Chapter ${CHAPTERS[ch][0]}`,CHAPTERS[ch][1],CHAPTERS[ch][2],done));}}
export function titleCard(kind,eye,title,sub,done){const el=$('#chap');el.className=kind;el.innerHTML=`<i class="orn"></i><small>${esc(eye)}</small><h2>${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}<i class="orn b"></i>`;
  void el.offsetWidth;el.classList.add('on');try{if(Au.on&&kind==='chapter')chord(['D3','A3','D4','F4'],3.2);}catch(e){}
  let fin=false;const end=()=>{if(fin)return;fin=true;el.classList.remove('on');el.onclick=null;setTimeout(done,450);};el.onclick=end;setTimeout(end,kind==='chapter'?3400:2600);}
function spkImg(k){const s=SPK[k];return s.c?PORTRAITS[s.c]:s.m?monImg(s.m):null;}
export const sc={lines:null,i:0,full:'',shown:0,raf:0,t0:0,done:null,spk:null};
const SG={};function sgEls(){if(!SG.box){const b=$('#saga .sg-box');Object.assign(SG,{box:b,pic:b.querySelector('.sg-pic'),img:b.querySelector('.sg-pic img'),name:b.querySelector('.sg-t b'),v:b.querySelector('.sg-t .v'),g:b.querySelector('.sg-t .g'),n:b.querySelector('.sg-n'),next:b.querySelector('.sg-next')});}return SG;}
function playScene(lines,done){sc.lines=lines.filter(([k])=>!SPK[k].c||S.party.some(p=>p.cls===SPK[k].c&&p.hp>0)||k==='N');if(!sc.lines.length)sc.lines=lines;sc.i=0;sc.done=done;sc.spk=null;
  const E=sgEls(),P=E.v.parentNode;P.style.minHeight='';let mh=0;
  sc.lines.forEach(([k,t])=>{E.box.className='sg-box '+(k==='N'?'sg-narr':k==='P'?'sg-page':k==='R'?'sg-foe':'sg-hero');E.v.textContent='';E.g.textContent=t;mh=Math.max(mh,P.offsetHeight);});
  P.style.minHeight=mh+'px';sceneLine(true);$('#saga').classList.add('on');}
function sceneLine(first){const [k,t]=sc.lines[sc.i];const s=SPK[k],E=sgEls();
  E.box.className='sg-box '+(k==='N'?'sg-narr':k==='P'?'sg-page':k==='R'?'sg-foe':'sg-hero');
  // portrait slot never leaves the layout: speakers crossfade, the narrator and pages show an emblem
  if(sc.spk!==k){const img=spkImg(k);E.pic.classList.toggle('emb',!img);
    if(img){if(first||!sc.spk){E.img.src=img;E.img.style.opacity=1;}else{E.img.style.opacity=0;setTimeout(()=>{if(sc.lines&&sc.lines[sc.i][0]===k){E.img.src=img;E.img.style.opacity=1;}},120);}}
    E.name.style.opacity=0;requestAnimationFrame(()=>{E.name.textContent=s.n||(k==='P'?'A lost page':'');E.name.style.opacity=1;});sc.spk=k;}
  E.n.textContent=`${sc.i+1} / ${sc.lines.length}`;E.next.textContent=sc.i<sc.lines.length-1?'▸':'◆';
  sc.full=t;sc.shown=0;E.v.textContent='';E.g.textContent=t;E.box.classList.remove('done');
  cancelAnimationFrame(sc.raf);sc.t0=performance.now()+(first?260:60);
  const CPS=62;const tick=now=>{const n=Math.max(0,Math.min(t.length,Math.floor((now-sc.t0)*CPS/1000)));
    if(n!==sc.shown){sc.shown=n;E.v.textContent=t.slice(0,n);E.g.textContent=t.slice(n);}
    if(n<t.length)sc.raf=requestAnimationFrame(tick);else E.box.classList.add('done');};
  sc.raf=requestAnimationFrame(tick);}
export function sceneNext(){const E=sgEls();if(sc.shown<sc.full.length){cancelAnimationFrame(sc.raf);sc.shown=sc.full.length;E.v.textContent=sc.full;E.g.textContent='';E.box.classList.add('done');return;}
  if(++sc.i<sc.lines.length){sceneLine(false);sfx('step');}else sceneEnd();}
export function sceneEnd(){cancelAnimationFrame(sc.raf);$('#saga').classList.remove('on');const d=sc.done;sc.done=null;setTimeout(()=>{sc.spk=null;d&&d();},380);}
$('#saga').addEventListener('click',e=>{if(!sc.done)return;if(e.target.closest('.sg-skip'))sceneEnd();else sceneNext();});

// lore pages in the world
const PAGE_TEX=(()=>{let t=null;return()=>t||(t=SRGB(pixTex(64,64,(u,v)=>{const x=Math.abs(u-.5),rod=Math.abs(v-.17)<.05||Math.abs(v-.83)<.05;
  if(rod&&x<.36)return x>.32?[90,58,30,255]:[150,100,52,255];if(x<.28&&v>.17&&v<.83){const ln=v>.28&&v<.74&&Math.abs(((v-.28)*9)%1-.5)<.12&&x<.2;const s=230-Math.abs(u-.5)*90;return ln?[120,92,58,255]:[s,s*.9,s*.68,255];}return[0,0,0,0];})));})();
export function placeLore(){dyn.lore={};LORE_POS[S.lvl].forEach(([x,y],i)=>{const id=S.lvl+':'+i;if(ST().lore[id])return;
  const s=sprite(PAGE_TEX(),.26,.26,x+.5,.34,y+.5);s.userData.bob=1;s.userData.base=.34;world.add(s);dyn.sprites.push(s);const g=glowSprite(0xffd890,.9,x+.5,.34,y+.5,.55);world.add(g);dyn.lore[x+','+y]=[s,g];});}
export function pickLore(){const i=LORE_POS[S.lvl].findIndex(([x,y])=>x===S.x&&y===S.y);if(i<0)return false;const id=S.lvl+':'+i;if(ST().lore[id])return false;
  ST().lore[id]=1;(dyn.lore[S.x+','+S.y]||[]).forEach(o=>world.remove(o));const [title,text]=LORE[S.lvl][i];const n=Object.keys(ST().lore).length;
  const bar=barIndex(id),bars=heldBars(ST().lore).length;
  log(`Lost page found: "${title}" (${n} of ${LORE_N}). It is kept in your journal.`,'gold');sfx('coin');giveXP(25,'');
  sagaPush(done=>{playBars([bar]);playScene([['N',`A loose page, half buried. "${title}"`],['P',text],
    ['N',bars===BAR_COUNT?'In the margin, the last missing bar of music. The Oath is whole at last.':`In the margin, a few bars of music in a careful hand. ${bars} of ${BAR_COUNT} bars of the same piece.`]],()=>{done();if(n===LORE_N){giveXP(300,'Every lost page recovered.');banner('The whole truth');}});});return true;}

// Caedmon's Oath: the nocturne in the margins of the lost pages
let oathPerf=null;
function playBars(bars){if(!Au.ctx||!Au.on||!bars.length)return 0;if(oathPerf)oathPerf.stop();oathPerf=scheduleNocturne(Au.ctx,bars);return oathPerf.duration;}
export function playOathMusic(){return playBars(heldBars(ST().lore));}
export function stopOathMusic(){if(oathPerf){oathPerf.stop();oathPerf=null;}}

// banter
export function maybeBark(){const st=ST();st.steps++;if(saga.on||st.steps-st.lastBark<28||Math.random()>.1)return;
  const L=S.lvl,w=S.weather&&S.weather.t;let pool;const hurt=S.party.some(p=>p.hp>0&&p.hp<p.maxhp*.4);
  if(hurt&&Math.random()<.5)pool=BARKS.hurt;else if((w==='rain'||w==='storm'||w==='fog')&&LEVELS[L].outdoor&&Math.random()<.5)pool=BARKS[w];
  else pool=L===0?(isDay()?BARKS.town:BARKS.townN):L===1?BARKS.cata:L===2?BARKS.spire:BARKS.wild;
  const opts=pool.filter(([k])=>S.party.some(p=>p.cls===SPK[k].c&&p.hp>0));if(!opts.length)return;const [k,t]=opts[ri(0,opts.length-1)];st.lastBark=st.steps;bark(k,t);}
let barkT=0;function bark(k,t){const el=$('#bark');el.innerHTML=`<img alt="" src="${spkImg(k)}"><div><b>${esc(SPK[k].n)}</b><span>${esc(t)}</span></div>`;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  clearTimeout(barkT);barkT=setTimeout(()=>el.classList.remove('on'),5200);log(`${SPK[k].n}: "${t}"`,'dim');$('#ticker').className='';}

// journal
export function openJournal(){if(saga.on)return;const el=$('#journal');renderJournal();el.hidden=false;requestAnimationFrame(()=>el.classList.add('on'));}
export function closeJournal(){const el=$('#journal');el.classList.remove('on');setTimeout(()=>{el.hidden=true;sagaPump();},220);}
function renderJournal(){const ch=curChapter(),G=chapterGoals(),st=ST(),n=Object.keys(st.lore).length;
  const chap=(i,side)=>{const done=G[i].every(g=>g[1]),cur=i===ch&&!side;const state=side?'sidep':done?'done':cur?'cur':i<ch?'done':'lock';
    if(state==='lock')return`<li class="jc lock"><span class="jn">${CHAPTERS[i][0]}</span><div><b>A chapter yet unwritten</b><small>Press on to reveal it.</small></div></li>`;
    return`<li class="jc ${state}"><span class="jn">${side?'✦':CHAPTERS[i][0]}</span><div><b>${side?'Side paths':esc(CHAPTERS[i][1])}</b>${side||cur?'':`<small>${esc(CHAPTERS[i][2])}</small>`}${cur||side?`<ul>${G[i].map(([t,d])=>`<li class="${d?'ok':''}">${IC(d?'check':'dot')}<span>${esc(t)}</span></li>`).join('')}</ul>`:''}</div></li>`;};
  let pages='';LORE.forEach((lv,li)=>lv.forEach(([t,x],i)=>{const got=st.lore[li+':'+i];pages+=got?`<details class="jp"><summary><span>${esc(t)}</span><small>${esc(LEVELS[li].name)}</small></summary><p>${esc(x)}</p></details>`:`<div class="jp lock"><span>Missing page</span><small>${(li===0||(S.visited||{})[li])?esc(LEVELS[li].name):'Somewhere unexplored'}</small></div>`;}));
  $('#journal').innerHTML=`<div class="jbox frame"><div class="jtop"><div><small>The Eclipse Crown</small><h3>Journal</h3></div><button class="btn" data-j="close">${IC('back')}Back to game</button></div>
   <div class="jgrid"><section><h4>Chapters</h4><ol class="jchaps">${[0,1,2,3,4].filter(i=>i<=Math.max(ch,0)+1&&i<5).map(i=>chap(i)).join('')}${chap(5,true)}</ol>${oathScore(st)}</section>
   <section><h4>Lost pages <em>${n} / ${LORE_N}</em></h4><div class="jpages">${pages}</div></section></div></div>`;}
function oathScore(st){const held=new Set(heldBars(st.lore));if(!held.size)return'';const whole=held.size===BAR_COUNT;
  const bars=Array.from({length:BAR_COUNT},(_,i)=>`<i class="${held.has(i)?'on':''}" title="Bar ${i+1}${held.has(i)?'':' (missing)'}"></i>`).join('');
  return`<div class="joath${whole?' whole':''}"><div class="jo-top"><div><b>Caedmon's Oath</b><small>${whole?'All twelve bars. The piece is whole.':`A nocturne in the margins · ${held.size} of ${BAR_COUNT} bars`}</small></div><button class="btn" data-j="oath">${IC('moon')}Play</button></div>
   <div class="jo-bars" aria-label="${held.size} of ${BAR_COUNT} bars found">${bars}</div>
   <p>${whole?'Some say the Oath, played whole, can reach whoever swore it.':'Each lost page carries a few bars of the same music in its margin.'}</p></div>`;}
$('#journal').addEventListener('click',e=>{if(e.target.closest('[data-j="oath"]')){Au.init();if(!Au.on)log('Turn the sound on to hear the Oath.','dim');playOathMusic();return;}
  if(e.target.id==='journal'||e.target.closest('[data-j="close"]')){stopOathMusic();closeJournal();}});
$('#quest').addEventListener('click',()=>{Au.init();openJournal();});
function renderQuest(){const q=$('#quest');if(!S||intro.active){q.hidden=true;return;}const ch=curChapter(),G=chapterGoals()[ch];const g=(G.find(x=>!x[1])||G[0])[0].replace(/ \(.*\)$/,'');
  q.hidden=S.mode!=='explore';q.innerHTML=`${IC('book')}<span><small>Chapter ${CHAPTERS[ch][0]}</small>${esc(g)}</span>`;}
Bus.on('hud',()=>{if(!S||intro.active||!$('#overlay').hidden){renderQuest();return;}chapterCheck();renderQuest();sagaPump();});
export function sagaReset(){saga.tok++;saga.q=[];saga.on=false;sc.done=null;cancelAnimationFrame(sc.raf);sc.spk=null;$('#saga').classList.remove('on');const c=$('#chap');c.classList.remove('on');c.onclick=null;document.body.classList.remove('saga');}
// watchdog: never leave the party frozen if a story job loses its callback
let sagaIdle=0;setInterval(()=>{if(saga.on&&!sc.done&&!$('#saga').classList.contains('on')&&!$('#chap').classList.contains('on')){if(!sagaIdle)sagaIdle=performance.now();else if(performance.now()-sagaIdle>5000){saga.tok++;saga.on=false;document.body.classList.remove('saga');sagaIdle=0;sagaPump();}}else sagaIdle=0;if(S&&!saga.on&&saga.q.length)sagaPump();},1000);
