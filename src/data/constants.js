// CONSTANTS (ported from the single-file build)

export const STEP_MIN=4;               // minutes per step
export const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
export const DIR_NAMES=['N','E','S','W'];

const TOWN=["################tttttttttttt", "#I.....#......S#,,,,t,,,,,,t", "#.###..#.####..#,ff,,,,ww,,t", "#.#N#....#..#..#,ff,t,www,,t", "#.#.####.#..#..#,,,,,,ww,f,t", "#......F..................,t", "###.#####.####.#,t,,f,,,t,,t", "#T..#...#....#.#,,,,,,,,,,,t", "#.#.#.G.#.##.#.#hhhh,,hhhh,t", "#.#...#...N#...#,,,,,,,,,,,t", "#.###.#.####.###,f,t,,o,,t,t", "#.....#......#.............=", "#.###.###.##.#.#,,t,,,,,,f,t", "#@..#...#..#...#,,,,t,,,,,,t", "###...#...#...N#,f,,,,,,t,,t", "####.#######.###,,,,,,,,,,,t", "t,,,.,,,,,,,.,,,,,,,,,,,,,,t", "t,t,.,,hhhh,.,,f,,,t,,,,,,,t", "t,,,.,,h,,h,.,,,,,,,,hhhhh,t", "t,f,.,,h,f,,.,t,,,,,,hg.gh,t", "t,,,...................>.h,t", "t,t,,,,,,,,,,,,t,,,,,hg.gh,t", "t,,,,f,,,,t,,,,,,,,,,hhhhh,t", "tttttttttttttttttttttttttttt"];
const WILD=["tttttttttttttttttttttttttttttttttttttttt", "tt,,,,,,tuttttt,,t,,rrr,,,,,,,ttttt,,,,t", "t,hhhhhhhhh,,,,,,u,,rrr,##,,,,,,,,,,,C,t", "t,hccccccc,,,,,,,,,urrr,##,,,,,,,,,,,,,t", "tthccccccc,,####,,,trrr........,,q,,,,,t", "t,hccccccc,,####,tttrrr,,,N,,,.q,,,q,,,t", "tthccccccc,,####,,,,rrr,,,,,,,,,,,,,,,,t", "tthccccccc,,####,t,rrr,k,t,,,,...Y,,q,,t", "tthccccccc,N,,,,,trrrfttt,tt,,,,,,,,,,,t", "tthccccccc,,,,,,,,rrrukktttt,,.q,,,q,,,t", "tuhhhhhhhhh,,,,,,,rrrftuf,tf,,.,,q,,,,,t", "t,uf,,t,uu,tku,,,,rrrtf,,ttt,,.,,,,,,,,t", "tt,,,t,,t,,t,tu,,trrrtuttt,t,,E,,,,,,,,t", "ttt,ut,,,ttt,ttt,,rrrtt,f,tt,,.,t,,,,,,t", "t,,,,,,,,,,,,,,,,,Nrrr,,,,,,,,.,,,wwww,t", "=...............E...bbb.........,,wwww,t", "t,,,,,,,.,,,,,,,,,,,rrr,,,,,,,.,,,wwww,t", "t,,,,,,,.,,,,,,,t,ttrrryy,,yy,.,f,wwww,t", "tt,mmmmm.mmmmmm,ktttrrryyy,yy,.,t,,,,,,t", "tt,mmfmm.mfmmfm,,tutrrryy,,,y,.,,,,,,,,t", "tt,fmmkm.fmmmmm,t,frrrt,,y,,,,.,,,,,,,,t", "tt,mmmmm.mmmmfm,,turrr,,yyy,y,.######,,t", "t,,mmmff.mfmkfm,,trrr,,yyyyyy,.#....#,,t", "tt,mmmfm.fmmmmm,,,rrrt,,,,,,,,.#....#,,t", "t,,ffCmm..........bbb.........E...C.#,,t", "tt,fmffmmmmmmmm,,,rrr,,,,,,,,,,#....#,,t", "tt,fkmmfmmmfffm,ttrrrtttt,,k,,,#....#,,t", "tt,,,,,,,,,,,,,,tttrrruututt,,,######,,t", "tttttfk,,,,tt,t,,t,rrr,,,,tk,,,,,,,,,,,t", "tttttttttttttttttttttttttttttttttttttttt"];
const CATA=["################","#<..#.....N#..C#","#.#.#.#####..#.#","#.#...#E.....#.#","#.#####.######.#","#.....#.F......#","###.#.#.######.#","#C#.#.#......#.#","#.#.#.######.#.#","#...#..E.....#.#","#..#..#####.#..#","##M##......##U##","#...#.####.#...#","#.2.#.#E.>.#.1.#","#...#......#...#","################"];
const SPIRE=["################","#<.....#.....C.#","#.####.#.#####.#","#.#..E.#...#...#","#.#.####.#.#.###","#.#......#.#.F.#","#.######.#.#####","#...N....#.....#","######.#####.#.#","#C.E...#.E...#.#","#.####.#.#####.#","#..............#","#######K########","#......A.......#","#......B.......#","################"];

export const LEVELS=[
 {name:'Hollowmere',sub:'Town',outdoor:true,link:3,wall:'house',floor:'cobble',danger:0,nightExtra:.05,pool:[],nightPool:['wolf','thief'],size:[1,2],fixed:[],map:TOWN,
  npc:[
   ['Old Maren, the lamplighter','"Sun magic burns hottest while the sun is up, and moon magic after dark. The cleric and the sorceress will each feel it. Choose your hour before you choose your fight."'],
   ['Watchman Tollin','"The catacomb stair is in the south-east corner. By day it is rats and old bones. After dusk the bats come out, and the wights with them."'],
   ['A weathered standing stone','Carved words: WHEN SUN AND MOON SHARE ONE SKY THE REGENT\'S WARD IS BROKEN. THE HEAVENS OBLIGE AT NOON ON EVERY THIRD DAY. BEAR BOTH SIGILS TO THE ALTAR AND YOU NEED NOT WAIT.']
  ]},
 {name:'Barrow Catacombs',sub:'Depth I',outdoor:false,wall:'stone',floor:'flag',ceil:'ceil',fog:0x07060a,torch:0xffb060,danger:.06,nightExtra:.06,pool:['rat','skel','spider'],nightPool:['bat','wight','ghoul'],size:[1,3],
  fixed:[['skel','skel'],['wight','rat','rat'],['skel','wight','bat']],map:CATA,
  npc:[['A dying pilgrim','"Two vaults lie in the south. The silver gate opens only under the moon. The gilded gate opens only under the sun. Each holds a sigil. You will need both, or a great deal of patience."']]},
 {name:'The Moonspire',sub:'Depth II',outdoor:false,wall:'crystal',floor:'flag2',ceil:'ceil2',fog:0x0b0816,torch:0xb8a4ff,danger:.07,nightExtra:.05,pool:['golem','uknight','sentinel'],nightPool:['moth','eater','shade'],size:[1,3],
  fixed:[['golem','moth'],['golem','uknight'],['uknight','eater']],map:SPIRE,
  npc:[['The Regent\'s last herald','"My master cannot be wounded while the sky is divided. Strike at the eclipse, or kindle one yourself at the altar beyond the sealed door."']]},
 {name:'The Wildwood',sub:'Wilds east of town',outdoor:true,link:0,wall:'stone',floor:'dirt',danger:.05,nightExtra:.05,pool:['boar','wolf','bandit','barkling'],nightPool:['wisp','bat','bear'],size:[1,3],
  fixed:[['wolf','wolf','wolf'],['boar','boar'],['wisp','wisp','boar']],map:WILD,
  npc:[['Old Tamsin, hermit of the grove','"The stone circle north-east of here drinks the sky. Stand at its heart by day and it mends the body. Stand there by night and it fills the mind. Once a day, mind you."'],
   ['Farmer Hesk','"The barley runs west of the river. Boars root through it by day. After dark the wisps drift up from the reeds, and they do not care for torches."'],
   ['Ansel, a nervous traveler','"The old watchtower to the south-east is crawling with wisps. Someone left a strongbox up there. I did not stay to look. The road back to Hollowmere is due west."']]}
];

LEVELS.forEach(L=>{L.W=L.map[0].length;L.H=L.map.length;});
export const MON={
 rat:{name:'Grave Rat',hp:12,atk:5,def:1,spd:6,xp:9,gold:4},
 skel:{name:'Bone Warden',hp:24,atk:7,def:3,spd:4,xp:18,gold:10},
 bat:{name:'Crypt Bat',hp:11,atk:6,def:0,spd:10,xp:12,gold:3},
 wight:{name:'Barrow Wight',hp:36,atk:9,def:4,spd:5,xp:38,gold:22,drain:1},
 wolf:{name:'Dusk Wolf',hp:18,atk:6,def:1,spd:8,xp:14,gold:5},
 golem:{name:'Glass Golem',hp:64,atk:12,def:8,spd:3,xp:70,gold:40},
 moth:{name:'Moth Seraph',hp:42,atk:11,def:3,spd:9,xp:60,gold:30},
 uknight:{name:'Umbral Knight',hp:72,atk:14,def:6,spd:5,xp:90,gold:55},
 eater:{name:'Star Eater',hp:56,atk:15,def:4,spd:7,xp:85,gold:45,drain:1},
 boar:{name:'Thornback Boar',hp:26,atk:8,def:2,spd:6,xp:22,gold:8},
 wisp:{name:'Bramble Wisp',hp:20,atk:9,def:1,spd:11,xp:26,gold:6,drain:1},
 thief:{name:'Alley Cutthroat',hp:16,atk:7,def:1,spd:10,xp:16,gold:12,steal:1},
 ghoul:{name:'Grave Ghoul',hp:30,atk:8,def:2,spd:5,xp:28,gold:12,poison:1},
 spider:{name:'Crypt Spider',hp:22,atk:7,def:2,spd:9,xp:24,gold:8,web:1},
 shade:{name:'Mirror Shade',hp:48,atk:12,def:3,spd:8,xp:70,gold:30,dodge:.3},
 sentinel:{name:'Star Sentinel',hp:80,atk:15,def:9,spd:4,xp:110,gold:60,charge:1},
 bandit:{name:'Road Bandit',hp:24,atk:8,def:3,spd:7,xp:24,gold:18,steal:1},
 bear:{name:'Moss Bear',hp:70,atk:13,def:4,spd:5,xp:80,gold:20},
 barkling:{name:'Barkling',hp:34,atk:8,def:5,spd:3,xp:30,gold:6,regen:5},
 regent:{name:'The Umbral Regent',hp:480,atk:17,def:7,spd:6,xp:1500,gold:1000,boss:1}
};

export const CLASSES={
 knight:{title:'Knight',hp:42,sp:0,atk:9,def:6,spd:4,crit:.10,weapon:'Longsword',grow:{hp:9,sp:0,atk:2,def:1,spd:0}},
 ranger:{title:'Ranger',hp:32,sp:0,atk:8,def:4,spd:8,crit:.25,weapon:'Longbow',grow:{hp:7,sp:0,atk:2,def:.8,spd:.5}},
 cleric:{title:'Sun Cleric',hp:30,sp:18,atk:5,def:5,spd:5,crit:.05,weapon:'Mace',school:'sun',grow:{hp:6,sp:5,atk:1,def:1,spd:0}},
 sorc:{title:'Moon Sorceress',hp:24,sp:22,atk:4,def:3,spd:6,crit:.05,weapon:'Staff',school:'moon',grow:{hp:4,sp:6,atk:1,def:.5,spd:.5}}
};

export const SPELLS={
 spark:{name:'Radiant Spark',school:'sun',sp:3,lvl:1,price:0,tgt:'enemy',pow:l=>9+l*2,desc:'Scorch one foe.'},
 mend:{name:'Mend',school:'sun',sp:4,lvl:1,price:0,tgt:'ally',heal:l=>14+l*3,desc:'Heal one ally.'},
 dawn:{name:'Dawn Ward',school:'sun',sp:6,lvl:2,price:250,tgt:'party',desc:'Party armor +4 for 3 rounds.'},
 rekindle:{name:'Rekindle',school:'sun',sp:12,lvl:3,price:500,tgt:'fallen',desc:'Raise a fallen ally.'},
 burst:{name:'Sunburst',school:'sun',sp:10,lvl:4,price:850,tgt:'all',pow:l=>10+l*2,desc:'Burn every foe.'},
 frost:{name:'Frost Lance',school:'moon',sp:3,lvl:1,price:0,tgt:'enemy',pow:l=>10+l*2,desc:'Pierce one foe.'},
 veil:{name:'Shadow Veil',school:'moon',sp:5,lvl:1,price:150,tgt:'foes',desc:'Foes miss far more for 3 rounds.'},
 tide:{name:'Tidal Pull',school:'moon',sp:7,lvl:2,price:300,tgt:'all',pow:l=>8+l*2,desc:'Crush every foe.'},
 starfall:{name:'Starfall',school:'moon',sp:14,lvl:4,price:950,tgt:'enemy',pow:l=>26+l*4,desc:'Drop a star on one foe.'}
};

export const SKILLS={
 knight:[
  {id:'wall',name:'Shield Wall',tier:1,act:1,cd:4,tgt:'none',desc:'The whole party takes half damage for 2 rounds.'},
  {id:'tough',name:'Toughness',tier:1,desc:'+20 maximum HP.'},
  {id:'cleave',name:'Cleave',tier:2,act:1,cd:3,tgt:'none',desc:'Strike every foe for 70% damage.'},
  {id:'riposte',name:'Riposte',tier:2,desc:'30% chance to strike back when hit.'},
  {id:'taunt',name:'Taunt',tier:3,act:1,cd:5,tgt:'none',desc:'Every foe must attack Aldric for 2 rounds, and he gains +6 armor.'},
  {id:'dawn',name:'Dawnbreaker',tier:3,desc:'+30% attack damage while the sun is up.'}],
 ranger:[
  {id:'twin',name:'Twin Shot',tier:1,act:1,cd:3,tgt:'none',desc:'Two arrows at random foes, 80% damage each.'},
  {id:'fleet',name:'Fleet-footed',tier:1,desc:'+2 speed, so she acts earlier.'},
  {id:'venom',name:'Venom Arrow',tier:2,act:1,cd:4,tgt:'enemy',desc:'A shot that poisons its target for 3 rounds.'},
  {id:'mark',name:'Hunter\'s Mark',tier:2,desc:'+15% critical chance.'},
  {id:'volley',name:'Volley',tier:3,act:1,cd:5,tgt:'none',desc:'Arrows fall on every foe for 110% damage.'},
  {id:'night',name:'Nightstalker',tier:3,desc:'+35% attack damage at night.'}],
 cleric:[
  {id:'smite',name:'Radiant Strike',tier:1,act:1,sp:4,tgt:'enemy',desc:'A mace blow wreathed in sunfire, stronger by day.'},
  {id:'bless',name:'Blessing',tier:1,desc:'All his healing is 25% stronger.'},
  {id:'sanct',name:'Sanctuary',tier:2,act:1,sp:9,tgt:'none',desc:'Heal every standing ally at once.'},
  {id:'devote',name:'Devotion',tier:2,desc:'+10 max SP, and regain 1 SP each round of battle.'},
  {id:'flare',name:'Solar Flare',tier:3,act:1,sp:13,tgt:'none',desc:'Scorch every foe and blind them for 2 rounds.'},
  {id:'undying',name:'Undying Light',tier:3,desc:'Once per battle, the first ally to fall rises again at 25% HP.'}],
 sorc:[
  {id:'focus',name:'Arcane Focus',tier:1,desc:'Her spell damage is 20% stronger.'},
  {id:'font',name:'Mana Font',tier:1,desc:'+12 maximum SP.'},
  {id:'chain',name:'Chain Frost',tier:2,act:1,sp:8,tgt:'enemy',desc:'A lance that leaps on to two more foes.'},
  {id:'lward',name:'Lunar Ward',tier:2,act:1,sp:6,tgt:'none',desc:'Foes miss more and the party gains +4 armor for 3 rounds.'},
  {id:'tide2',name:'Tidecaller',tier:3,desc:'Moon spells cost 2 less SP.'},
  {id:'meteor',name:'Falling Star',tier:3,act:1,sp:18,tgt:'enemy',desc:'A star crashes down on one foe for enormous damage.'}]
};
export const TIER_LVL=[0,1,3,5],TIER_COST=[0,1,1,2];
export const TRAIN={mig:{name:'Might',desc:'+1 attack'},vit:{name:'Vitality',desc:'+6 max HP'},agi:{name:'Agility',desc:'+0.4 speed, +1% critical'},spi:{name:'Spirit',desc:'+4 max SP, +3% spell power'}};
export const GEAR_W=[{n:'Worn',b:0},{n:'Iron',b:3,p:80},{n:'Steel',b:6,p:240},{n:'Mithril',b:10,p:680}];
export const GEAR_A=[{n:'Padded',b:0},{n:'Mail',b:2,p:70},{n:'Plate',b:5,p:220},{n:'Starwoven',b:9,p:640}];
export const PRICES={potion:20,ether:45,inn:12,revive:80};
export const xpNeed=l=>60*l+20*l*l;
