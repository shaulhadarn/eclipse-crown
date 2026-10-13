// WEATHER & ATMOSPHERE (ported from the single-file build)
import './world.js'; // load-order chain: keeps the original top-to-bottom start-up order
import * as THREE from 'three';
import { LEVELS } from '../data/constants.js';
import { S, hourOf, ri, rnd } from '../core/state.js';
import { flash, log } from '../ui/log.js';
import { Au, sfx } from '../audio/audio.js';
import { TEX } from './textures.js';
import { MAT, WIND, camera, dyn, hemi, moonSpr, pixTex, renderer, scene, sky, stars, sun, sunSpr } from './world.js';
import { intro } from '../story/prologue.js';

export const WXT={
 clear:{name:'Clear',icon:'✦',cloud:0,rain:0,fog:0,dark:0,wind:.2,storm:0,fx:''},
 cloudy:{name:'Overcast',icon:'☁',cloud:.9,rain:0,fog:.12,dark:.28,wind:.45,storm:0,fx:''},
 fog:{name:'Fog',icon:'≋',cloud:.55,rain:0,fog:1,dark:.22,wind:.05,storm:0,fx:'Foes are harder to spot and ambush more often. Moon magic +10%.'},
 rain:{name:'Rain',icon:'☂',cloud:1,rain:.65,fog:.3,dark:.45,wind:.6,storm:0,fx:'Sun magic −15%. Bowshots are less accurate.'},
 storm:{name:'Thunderstorm',icon:'ϟ',cloud:1,rain:1,fog:.35,dark:.68,wind:1,storm:1,fx:'Sun magic −25%. Lightning may strike your foes in battle.'}};
const WX={cloud:0,rain:0,fog:0,dark:0,wind:.2,storm:0,flash:0,next:8,drops:0};
const WX_MSG={clear:'The clouds break apart and the sky clears.',cloudy:'A grey overcast rolls across the sky.',fog:'A thick fog creeps in. You can barely see ten paces.',rain:'Dark clouds gather, and rain begins to fall.',storm:'Thunder rolls overhead. A storm breaks over the land!'};
function wxPick(){const h=hourOf();const w=[['clear',34],['cloudy',24],['fog',h>=3&&h<10?26:7],['rain',17],['storm',8]].filter(([t])=>t!==S.weather.t);
  const tot=w.reduce((a,b)=>a+b[1],0);let r=Math.random()*tot;for(const [t,v] of w){r-=v;if(r<=0)return t;}return'clear';}
export function wxTick(){if(!S.weather)S.weather={t:'clear',until:S.time+ri(120,300)};if(intro.active)return;
  if(S.time>=S.weather.until){S.weather={t:wxPick(),until:S.time+ri(180,420)};if(LEVELS[S.lvl].outdoor)log(WX_MSG[S.weather.t],'time');}}
export const wxType=()=>LEVELS[S.lvl].outdoor&&S.weather&&!intro.active?S.weather.t:'under';
export function wxMag(school){const t=wxType();if(t==='rain')return school==='sun'?.85:1;if(t==='storm')return school==='sun'?.75:1;if(t==='fog')return school==='moon'?1.1:1;return 1;}
export function wxChip(){const t=wxType();if(t==='under'){const a=S.weather?WXT[S.weather.t]:null;return a&&S.weather.t!=='clear'?`<span class="chip">Above: ${a.name}</span>`:'';}const w=WXT[t];return`<span class="chip wx" title="${w.fx}">${w.icon} ${w.name}</span>`;}
// ---- visuals ----
let rainLines,rainSplash,mistLayers=[],drips;
export function setupWeatherFX(){
  const N=1600,pos=new Float32Array(N*6);WX.drops=N;WX.dy=new Float32Array(N);
  for(let i=0;i<N;i++){const x=rnd(-7,7),z=rnd(-7,7),y=rnd(0,5);pos.set([x,y,z,x,y-.3,z],i*6);WX.dy[i]=rnd(.8,1.2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setDrawRange(0,0);
  rainLines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xb8c8e0,transparent:true,opacity:.35,depthWrite:false}));rainLines.frustumCulled=false;scene.add(rainLines);
  const sp=new Float32Array(260*3);for(let i=0;i<260;i++)sp.set([rnd(-5,5),.02,rnd(-5,5)],i*3);
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  rainSplash=new THREE.Points(sg,new THREE.PointsMaterial({map:TEX.glow,size:.05,color:0xdfe8ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));rainSplash.frustumCulled=false;scene.add(rainSplash);
  // ground mist: tileable noise layers that hug the floor
  const S2=64,grid=8,vals=[];for(let i=0;i<grid*grid;i++)vals.push(Math.random());
  const vn=(x,y)=>{const xi=Math.floor(x)%grid,yi=Math.floor(y)%grid,xf=x-Math.floor(x),yf=y-Math.floor(y);const a=vals[yi*grid+xi],b=vals[yi*grid+(xi+1)%grid],c=vals[((yi+1)%grid)*grid+xi],d=vals[((yi+1)%grid)*grid+(xi+1)%grid];const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
  const mt=pixTex(S2,S2,(u,v)=>{let n=vn(u*grid,v*grid)*.6+vn((u*grid*2)%grid,(v*grid*2)%grid)*.4;n=Math.max(0,(n-.35)/.65);return[255,255,255,255*n];});mt.wrapS=mt.wrapT=THREE.RepeatWrapping;
  [.1,.2,.32].forEach((y,i)=>{const t=mt.clone();t.needsUpdate=true;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2.2+i*.4,2.2+i*.4);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:0,depthWrite:false,color:0xdde4ee}));m.rotation.x=-Math.PI/2;m.position.y=y;m.renderOrder=3;m.userData={y,sp:.012+i*.008,dir:i%2?1:-1};scene.add(m);mistLayers.push(m);});
  const dp=new Float32Array(24*3);for(let i=0;i<24;i++)dp.set([rnd(-3,3),rnd(0,1),rnd(-3,3)],i*3);
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
  drips=new THREE.Points(dg,new THREE.PointsMaterial({map:TEX.glow,size:.03,color:0x9ab0c8,transparent:true,opacity:.8,depthWrite:false}));drips.frustumCulled=false;scene.add(drips);
}
const cW=new THREE.Color(),cW2=new THREE.Color();
export function applyWeather(now,dt){
  if(!S)return;const L=LEVELS[S.lvl],out=!!L.outdoor,cp=camera.position;const t=wxType();const T=WXT[t==='under'?'clear':t];
  const k=Math.min(1,dt*.9);['cloud','rain','fog','dark','wind','storm'].forEach(q=>{WX[q]+=((out?T[q]:0)-WX[q])*k;});
  WIND.value+=dt*(1+WX.wind*2.2);
  // lightning
  if(out&&WX.storm>.5&&!intro.active){WX.next-=dt;if(WX.next<=0){WX.next=rnd(5,14);lightning();}}
  WX.flash=Math.max(0,WX.flash-dt*3.2);const fl=WX.flash>0?WX.flash*(0.6+0.4*Math.abs(Math.sin(now*.09))):0;
  if(!out)renderer.toneMappingExposure=1.2;
  if(out){
    const U=sky.material.uniforms;cW.copy(scene.fog.color);cW2.setRGB(.26,.29,.33).multiplyScalar(hourOf()>6&&hourOf()<18?1:.35);
    U.top.value.lerp(cW2,Math.min(1,WX.dark*1.1));U.hor.value.lerp(cW2,WX.dark*.85);renderer.toneMappingExposure=1.2*(1-WX.dark*.38)+WX.flash*.8;U.cAmt.value=Math.max(U.cAmt.value,WX.cloud*.95);U.cCov.value=WX.cloud;
    U.cLit.value.multiplyScalar(1-WX.dark*.45);U.cDark.value.multiplyScalar(1-WX.dark*.55);U.glow.value*=1-WX.cloud*.85;
    sunSpr.material.opacity=1-WX.cloud*.9;moonSpr.material.opacity*=1-WX.cloud*.8;stars.material.opacity*=1-WX.cloud*.95;
    sun.intensity*=1-WX.dark*.8;if(WX.dark>.4)sun.castShadow=false;hemi.intensity*=1-WX.dark*.3;
    const fc=scene.fog.color;fc.lerp(cW2.setRGB(.3,.33,.37).multiplyScalar(hourOf()>6&&hourOf()<18?1:.3),Math.max(WX.fog*.8,WX.dark*.5));
    scene.background=fc;U.hor.value.lerp(fc,WX.fog*.9);U.top.value.lerp(fc,WX.fog*.7);MAT.mount.color.lerp(fc,WX.fog*.9+WX.rain*.3);
    scene.fog.near=8-WX.fog*6.6-WX.rain*2;scene.fog.far=38-WX.fog*27-WX.rain*12;
    if(fl){hemi.intensity+=fl*2.2;U.top.value.addScalar(fl*.5);U.hor.value.addScalar(fl*.7);scene.fog.color.addScalar(fl*.25);}
    MAT.grass.color.setScalar(1-WX.rain*.22);if(dyn.floorMat){dyn.floorMat.color.setScalar(1-WX.rain*.3);dyn.floorMat.roughness=.85-WX.rain*.55;dyn.floorMat.metalness=WX.rain*.25;}
  }
  // rain
  const nDrops=Math.floor(WX.drops*WX.rain);rainLines.visible=out&&nDrops>0;rainSplash.visible=rainLines.visible;
  if(rainLines.visible){const P=rainLines.geometry.attributes.position,a=P.array,sp=9*dt,sx=WX.wind*.1;rainLines.position.set(cp.x,0,cp.z);
    for(let i=0;i<nDrops;i++){const o=i*6;let y=a[o+1]-sp*WX.dy[i];if(y<0){y+=5;a[o]=rnd(-7,7);a[o+2]=rnd(-7,7);}a[o+1]=y;a[o+3]=a[o]-sx*3;a[o+4]=y-.32;a[o+5]=a[o+2];a[o]+=0;}
    P.needsUpdate=true;rainLines.geometry.setDrawRange(0,nDrops*2);rainLines.material.opacity=.22+WX.rain*.2;
    rainSplash.position.set(cp.x,0,cp.z);const SP=rainSplash.geometry.attributes.position;for(let j=0;j<20;j++){const i=Math.floor(Math.random()*260);SP.array[i*3]=rnd(-5,5);SP.array[i*3+2]=rnd(-5,5);}SP.needsUpdate=true;rainSplash.material.opacity=WX.rain*.55;}
  // ground mist
  const h=hourOf();const dawn=out&&h>=4&&h<8.5?.16:0;
  const mistA=out?Math.min(.62,WX.fog*.55+WX.rain*.1+dawn):(S.lvl===1?.2:S.lvl===2?.16:0);
  const mcol=out?scene.fog.color:(S.lvl===2?cW.setRGB(.55,.45,.8):cW.setRGB(.55,.5,.45));
  mistLayers.forEach((m,i)=>{m.visible=mistA>.01&&!intro.active;m.position.x=Math.round(cp.x);m.position.z=Math.round(cp.z);m.material.opacity=mistA*(1-i*.22);m.material.color.copy(mcol);
    m.material.map.offset.x+=m.userData.sp*dt*m.userData.dir*(1+WX.wind);m.material.map.offset.y+=m.userData.sp*.6*dt;});
  // catacomb drips
  drips.visible=S.lvl===1;if(drips.visible){drips.position.set(cp.x,0,cp.z);const D=drips.geometry.attributes.position.array;for(let i=0;i<24;i++){D[i*3+1]-=dt*(.9+i%3*.3);if(D[i*3+1]<0){D[i*3+1]=1;D[i*3]=rnd(-3,3);D[i*3+2]=rnd(-3,3);if(Math.hypot(D[i*3],D[i*3+2])<1.5&&Math.random()<.3)sfx('drip');}}drips.geometry.attributes.position.needsUpdate=true;}
  ambientSound(dt,out);
}
export function lightning(){WX.flash=1;flash('#dfe8ff');const d=rnd(.4,2.2);setTimeout(()=>sfx('thunder'),d*1000);}
// ---- ambient audio ----
const AMB={t:6,rain:null,wind:null};
function noiseLoop(freq,type){const c=Au.ctx;const n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),a=b.getChannelData(0);let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;last=type==='brown'?(last+.02*w)/1.02:w;a[i]=type==='brown'?last*3.5:w;}
  const s=c.createBufferSource();s.buffer=b;s.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;const g=c.createGain();g.gain.value=0;s.connect(f).connect(g).connect(c.destination);s.start();return g;}
function ambientSound(dt,out){
  if(!Au.ctx)return;if(!AMB.rain){AMB.rain=noiseLoop(2400,'white');AMB.wind=noiseLoop(420,'brown');}
  const on=Au.on&&!intro.active?1:0,t=Au.ctx.currentTime;
  AMB.rain.gain.setTargetAtTime(on*(out?WX.rain*.085:(S.weather&&S.weather.t!=='clear'&&S.weather.t!=='cloudy'&&S.weather.t!=='fog'?.012:0)),t,.4);
  AMB.wind.gain.setTargetAtTime(on*(out?.05+WX.wind*.16:(S.lvl===1?.05:.035)),t,.6);
  if(!on||S.mode!=='explore')return;AMB.t-=dt;if(AMB.t>0)return;AMB.t=rnd(9,22);
  const h=hourOf(),day=h>=6&&h<18;
  if(out){if(WX.rain>.3)return;if(day)sfx('bird');else sfx(S.lvl===3&&Math.random()<.4?'howl':'owl');if(S.lvl===0&&Math.random()<.15)sfx('bell');}
  else sfx(S.lvl===1?(Math.random()<.5?'groan':'chain'):'chime');
}
