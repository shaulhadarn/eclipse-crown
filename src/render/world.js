// THREE SETUP (ported from the single-file build)
import './textures.js'; // load-order chain: keeps the original top-to-bottom start-up order
import * as THREE from 'three';
import { LEVELS } from '../data/constants.js';
import { $, Bus, C, FR, FIXED_IDX, LH, LW, NATS, S, clamp, hourOf, inMap, isDay, isEclipse, tile, ui } from '../core/state.js';
import { TEX, TEXQ, buildTextures, labelTex, monTex, orbTex, speck, tex } from './textures.js';
import { setupWeatherFX } from './weather.js';
import { canAct, ensureRoamers, roamActive } from '../game/exploration.js';
import { sheet } from '../ui/character-sheet.js';
import { easeIO, intro } from '../story/prologue.js';
import { placeLore } from '../story/saga.js';
import { KEYMAP } from '../core/input.js';
import { setupSparks } from '../core/loop.js';

export const PERF={dpr:1,cap:1.5,min:.65,acc:0,n:0,cool:0,sunKey:''};
export let renderer,scene,camera,world,hemi,ambient,sun,moonLight,torch,stars,combatGroup,sky,sunSpr,moonSpr,clouds,dust;
const sconceLights=[];
export const MAT={};
export const anim={active:false};
export let yaw=0;
export const dyn={gates:[],sprites:[],altar:null,lamps:[],rings:[],water:null,glints:[]};
export const SRGB=t=>{t.encoding=THREE.sRGBEncoding;return t;};
const DECAL=(m,k)=>{m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2*k;return m;};
export const WIND={value:0};
function windify(mat,w){mat.onBeforeCompile=sh=>{sh.uniforms.uWind=WIND;sh.vertexShader='uniform float uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  #ifdef USE_INSTANCING
  vec3 ip=instanceMatrix[3].xyz;
  #else
  vec3 ip=vec3(0.);
  #endif
  float sw=sin(uWind*1.6+ip.x*1.3+ip.z*.9)+sin(uWind*2.7+ip.z*2.1+ip.x)*.4;
  transformed.x+=sw*${w};transformed.z+=sw*.6*${w};`);};}
export const hash2=(x,y,k=0)=>{const v=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return v-Math.floor(v);};
const V1=new THREE.Vector3(),V2=new THREE.Vector3();

export function pixTex(w,h,fn){const d=new Uint8Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=fn((x+.5)/w,(y+.5)/h);const i=(y*w+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=Math.max(0,Math.min(255,Math.round(c[3])));}
  const t=new THREE.DataTexture(d,w,h,THREE.RGBAFormat);t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;}
export const radial=(u,v)=>Math.min(1,Math.hypot(u*2-1,v*2-1));
function extraTextures(){
  TEX.roof=tex(128,128,(g,w,h,r)=>{g.fillStyle='#2a1410';g.fillRect(0,0,w,h);for(let row=0;row<8;row++){const off=(row%2)*8;for(let x=-16;x<w+16;x+=16){const s=r()*.25+.75;const gr=g.createLinearGradient(0,row*16,0,row*16+16);gr.addColorStop(0,`rgb(${120*s|0},${52*s|0},${36*s|0})`);gr.addColorStop(1,`rgb(${70*s|0},${28*s|0},${20*s|0})`);g.fillStyle=gr;g.beginPath();g.moveTo(x+off,row*16);g.lineTo(x+off+15,row*16);g.lineTo(x+off+15,row*16+10);g.quadraticCurveTo(x+off+7.5,row*16+18,x+off,row*16+10);g.closePath();g.fill();}}speck(g,w,h,r,500,.06);},31,true);
  TEX.glow=pixTex(64,64,(u,v)=>{const t=radial(u,v);const a=t<.25?1-t/.25*.45:.55*Math.pow(1-(t-.25)/.75,1.6);return[255,255,255,a*255];});
  TEX.blob=pixTex(64,64,(u,v)=>{const t=radial(u,v);return[0,0,0,.6*Math.pow(1-t,1.5)*255];});
  TEX.grass=tex(128,128,(g,w,h,r)=>{g.fillStyle='#2c4520';g.fillRect(0,0,w,h);for(let i=0;i<1600;i++){const v=r();g.strokeStyle=`rgba(${60+v*70|0},${95+v*80|0},${35+v*30|0},${.35+r()*.4})`;g.lineWidth=1;const x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*3,y-2-r()*4);g.stroke();}for(let i=0;i<14;i++){g.fillStyle=`rgba(20,35,15,${.15+r()*.2})`;g.beginPath();g.ellipse(r()*w,r()*h,6+r()*12,4+r()*8,r()*3,0,7);g.fill();}},43,true);
  TEX.tuft=tex(64,64,(g,w,h,r)=>{g.clearRect(0,0,w,h);for(let i=0;i<16;i++){const x=6+r()*52,hh=26+r()*34,lean=(r()-.5)*18;const gr=g.createLinearGradient(0,64,0,64-hh);gr.addColorStop(0,'#223a16');gr.addColorStop(1,r()<.5?'#8cbf52':'#6fa843');g.fillStyle=gr;g.beginPath();g.moveTo(x-2.2,64);g.quadraticCurveTo(x+lean*.4,64-hh*.6,x+lean,64-hh);g.quadraticCurveTo(x+lean*.4+1,64-hh*.6,x+2.2,64);g.closePath();g.fill();}},45);
  TEX.leaves=tex(128,128,(g,w,h,r)=>{g.fillStyle='#1d3a18';g.fillRect(0,0,w,h);for(let i=0;i<420;i++){const v=r();g.fillStyle=`rgb(${30+v*50|0},${70+v*70|0},${25+v*30|0})`;g.beginPath();g.ellipse(r()*w,r()*h,3+r()*4,2+r()*2.5,r()*3,0,7);g.fill();}},47,true);
  TEX.bark=tex(64,128,(g,w,h,r)=>{g.fillStyle='#3a2a1c';g.fillRect(0,0,w,h);for(let i=0;i<60;i++){g.strokeStyle=`rgba(${20+r()*40|0},${14+r()*25|0},10,.7)`;g.lineWidth=1+r()*2;const x=r()*w;g.beginPath();g.moveTo(x,0);g.lineTo(x+(r()-.5)*6,h);g.stroke();}},49,true);
  TEX.flower=tex(32,32,(g)=>{g.clearRect(0,0,32,32);g.fillStyle='#fff';for(let i=0;i<5;i++){const a=i/5*Math.PI*2;g.beginPath();g.ellipse(16+Math.cos(a)*7,16+Math.sin(a)*7,5,3.6,a,0,7);g.fill();}g.fillStyle='#f3c94a';g.beginPath();g.arc(16,16,3.4,0,7);g.fill();},51);
  TEX.dirt=tex(128,128,(g,w,h,r)=>{g.fillStyle='#6b4a2a';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=r();g.fillStyle=`rgba(${95+v*50|0},${64+v*34|0},${34+v*20|0},${.4+r()*.4})`;g.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);}for(let i=0;i<40;i++){const s2=40+r()*40|0;g.fillStyle=`rgb(${s2+30},${s2+20},${s2+10})`;g.beginPath();g.ellipse(r()*w,r()*h,1.5+r()*3,1+r()*2,r()*3,0,7);g.fill();}for(let i=0;i<8;i++){g.fillStyle='rgba(30,22,14,.25)';g.beginPath();g.ellipse(r()*w,r()*h,8+r()*14,3+r()*5,r()*3,0,7);g.fill();}},53,true);
  TEX.soil=tex(64,64,(g,w,h,r)=>{g.fillStyle='#3e2c1c';g.fillRect(0,0,w,h);for(let row=0;row<3;row++){const y=row*21+4;const gr=g.createLinearGradient(0,y,0,y+14);gr.addColorStop(0,'#5a4028');gr.addColorStop(1,'#2e2014');g.fillStyle=gr;g.fillRect(0,y,w,14);}for(let i=0;i<220;i++){g.fillStyle=`rgba(${80+r()*40|0},${60+r()*30|0},40,.35)`;g.fillRect(r()*w,r()*h,1,1);}},55);
  TEX.birch=tex(32,128,(g,w,h,r)=>{g.fillStyle='#e6e2d6';g.fillRect(0,0,w,h);for(let i=0;i<26;i++){g.fillStyle=`rgba(30,26,22,${.5+r()*.4})`;g.fillRect(r()*w*.6,r()*h,4+r()*14,1+r()*2.5);}for(let i=0;i<300;i++){g.fillStyle='rgba(150,140,120,.25)';g.fillRect(r()*w,r()*h,1,1);}},57,true);
  TEX.fern=tex(64,64,(g,w,h,r)=>{g.clearRect(0,0,w,h);for(let f=0;f<3;f++){const bx=14+f*18,lean=(f-1)*8;g.strokeStyle='#2a4a1c';g.lineWidth=1.5;g.beginPath();g.moveTo(bx,64);g.quadraticCurveTo(bx+lean*.5,34,bx+lean,6);g.stroke();for(let i=0;i<11;i++){const t=i/11,px=bx+lean*t*t,py=64-t*58,len=(1-t)*11+2;g.fillStyle=`rgb(${60+i*6},${110+i*6},${40+i*2})`;[-1,1].forEach(sd=>{g.beginPath();g.ellipse(px+sd*len*.5,py,len*.55,1.8,sd*.5,0,7);g.fill();});}}},59);
  TEX.cloud=tex(256,128,(g,w,h,r)=>{for(let i=0;i<22;i++){const x=40+r()*176,y=50+r()*40,rad=18+r()*30;const gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}},37);
  TEX.moon=pixTex(128,128,(u,v)=>{const d=radial(u,v);const R=.38;if(d<R){let k=1;[[.44,.46,.06],[.56,.55,.08],[.5,.4,.05],[.42,.58,.04],[.6,.44,.035]].forEach(([cx,cy,r])=>{const q=Math.hypot(u-cx,v-cy);if(q<r)k-=.18*(1-q/r);});const e=Math.min(1,(R-d)/.02);return[232*k,238*k,252*k,255*e+ (1-e)*90];}
    const g=Math.max(0,1-(d-R)/(1-R));return[200,215,255,90*g*g];});
  TEX.flame=pixTex(64,128,(u,v)=>{const y=v,x=u*2-1;const w=Math.pow(Math.sin(Math.min(1,y*1.05)*Math.PI),.75)*(.28+.42*(1-y));if(w<=0||Math.abs(x)>=w)return[255,120,40,0];const k=1-Math.abs(x)/w;const core=Math.pow(k,1.2)*Math.min(1,(1-y)*1.6+.2);
    return[255,Math.round(110+145*Math.min(1,core*1.3)),Math.round(30+200*Math.pow(core,2.2)),255*Math.min(1,core*1.4)];});
}

export function setup3D(){
  buildTextures();extraTextures();Object.values(TEX).forEach(SRGB);
  const DPR=window.devicePixelRatio||1,MOBILE=matchMedia('(pointer:coarse)').matches;
  // Desktop never renders below native resolution: upscaling a low-res frame is what made the view look pixelated.
  PERF.cap=Math.min(DPR,MOBILE?1.5:2);PERF.dpr=PERF.cap;PERF.min=MOBILE?.65:Math.min(1,DPR);
  renderer=new THREE.WebGLRenderer({antialias:DPR<1.5,powerPreference:'high-performance'});
  renderer.setPixelRatio(PERF.dpr);renderer.shadowMap.autoUpdate=false;
  TEXQ.aniso=Math.min(MOBILE?4:16,renderer.capabilities.getMaxAnisotropy());
  Object.values(TEX).forEach(t=>{if(t.isTexture&&t.anisotropy!==TEXQ.aniso){t.anisotropy=TEXQ.aniso;t.needsUpdate=true;}});
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  $('#view').prepend(renderer.domElement);
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(72,16/10,.09,140);
  hemi=new THREE.HemisphereLight(0xbfd4ff,0x3a2c1c,.5);scene.add(hemi);
  ambient=new THREE.AmbientLight(0xffffff,.06);scene.add(ambient);
  sun=new THREE.DirectionalLight(0xfff0d0,1.5);sun.castShadow=true;{const q=MOBILE?1024:Math.min(4096,renderer.capabilities.maxTextureSize);sun.shadow.mapSize.set(q,q);}
  const sc=sun.shadow.camera;sc.left=-13;sc.right=13;sc.top=13;sc.bottom=-13;sc.near=1;sc.far=70;sun.shadow.bias=-.0008;sun.shadow.normalBias=.035;
  scene.add(sun);scene.add(sun.target);sun.target.position.set(8,0,8);
  moonLight=new THREE.DirectionalLight(0x9fb6ff,.3);scene.add(moonLight);scene.add(moonLight.target);moonLight.target.position.set(8,0,8);
  torch=new THREE.PointLight(0xffb060,1.4,6.5,2);scene.add(torch);
  for(let i=0;i<3;i++){const l=new THREE.PointLight(0xff9a40,0,4.5,2);scene.add(l);sconceLights.push(l);}
  sky=new THREE.Mesh(new THREE.SphereGeometry(60,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false,
    uniforms:{top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color()},glow:{value:1},uT:{value:0},cCov:{value:0},cLit:{value:new THREE.Color(1,1,1)},cDark:{value:new THREE.Color(.6,.65,.75)},cAmt:{value:1}},
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform vec3 top,hor,sunCol,sunDir,cLit,cDark;uniform float glow,uT,cAmt,cCov;varying vec3 vP;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*ns(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}
void main(){float h=clamp(vP.y,0.,1.);vec3 c=mix(hor,top,pow(h,.5));vec3 sd=normalize(sunDir);float d=max(dot(vP,sd),0.);c+=sunCol*(pow(d,6.)*.28+pow(d,48.)*.55)*glow;
 if(vP.y>0.){vec2 uv=vP.xz/(vP.y+.18)*1.15+vec2(uT*.012,uT*.004);float n=fbm(uv);float cov=smoothstep(.5-cCov*.36,.78-cCov*.26,n)*smoothstep(.0,.22,vP.y);
  float lit=clamp(fbm(uv-sd.xz*.08)-n+.55,0.,1.);vec3 cc=mix(cDark,cLit,lit);cc+=sunCol*pow(d,5.)*.35*glow;c=mix(c,cc,cov*cAmt);}
 c=mix(c,hor*.55,clamp(-vP.y*3.,0.,1.));gl_FragColor=vec4(c,1.);}`}));
  sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);
  sunSpr=sprite(TEX.glow,9,9,0,0,0);Object.assign(sunSpr.material,{blending:THREE.AdditiveBlending,depthWrite:false,fog:false});sunSpr.renderOrder=-9;scene.add(sunSpr);
  moonSpr=sprite(TEX.moon,4.6,4.6,0,0,0);Object.assign(moonSpr.material,{depthWrite:false,fog:false});moonSpr.renderOrder=-8;scene.add(moonSpr);
  clouds=new THREE.Group();scene.add(clouds);
  const sg=new THREE.BufferGeometry();const pts=[];for(let i=0;i<900;i++){const u=Math.random()*Math.PI*2,v=Math.asin(Math.random())*.95;pts.push(Math.cos(u)*Math.cos(v)*52,Math.sin(v)*52,Math.sin(u)*Math.cos(v)*52);}
  sg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xdfe6ff,size:.22,transparent:true,opacity:0,fog:false,depthWrite:false,map:TEX.glow,blending:THREE.AdditiveBlending}));stars.renderOrder=-9;stars.frustumCulled=false;scene.add(stars);
  const N=240,dg=new THREE.BufferGeometry(),dp=new Float32Array(N*3);for(let i=0;i<N;i++){dp[i*3]=Math.random()*8-4;dp[i*3+1]=Math.random()*1.1;dp[i*3+2]=Math.random()*8-4;}
  dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
  dust=new THREE.Points(dg,new THREE.PointsMaterial({map:TEX.glow,size:.045,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffd9a0,opacity:.5}));dust.frustumCulled=false;scene.add(dust);
  combatGroup=new THREE.Group();scene.add(combatGroup);
  setupWeatherFX();setupSparks();
  const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.9,metalness:0},o));
  MAT.house=std({map:TEX.house,bumpMap:TEX.house,bumpScale:.025,emissiveMap:TEX.houseGlow,emissive:0xffa040,emissiveIntensity:0});
  MAT.roof=std({map:TEX.roof,bumpMap:TEX.roof,bumpScale:.035,roughness:.75});
  MAT.stone=std({map:TEX.stone,bumpMap:TEX.stone,bumpScale:.05});
  MAT.crystal=std({map:TEX.crystal,bumpMap:TEX.crystal,bumpScale:.03,roughness:.3,metalness:.25,emissiveMap:TEX.crystalGlow,emissive:0x6a58d8,emissiveIntensity:.6});
  MAT.wood=std({map:TEX.wood,bumpMap:TEX.wood,bumpScale:.02,roughness:.7});
  MAT.iron=std({map:TEX.iron,roughness:.45,metalness:.65});
  MAT.pedestal=std({color:0x3a3350,emissive:0x2a1d55,emissiveIntensity:.9,roughness:.35,metalness:.2});
  MAT.basin=std({map:TEX.stone,bumpMap:TEX.stone,bumpScale:.03});
  MAT.water=new THREE.MeshStandardMaterial({color:0x1d4a9a,emissive:0x2a6aff,emissiveIntensity:.5,roughness:.08,metalness:.4});
  MAT.hole=DECAL(new THREE.MeshBasicMaterial({color:0x000000}),2);
  MAT.post=std({color:0x1c1612,roughness:.5,metalness:.5});
  MAT.lantern=new THREE.MeshBasicMaterial({color:0xffc26a,toneMapped:false});
  MAT.grass=DECAL(std({map:TEX.grass,bumpMap:TEX.grass,bumpScale:.03}),1);
  MAT.tuft=std({map:TEX.tuft,alphaTest:.45,side:THREE.DoubleSide,roughness:.85});windify(MAT.tuft,'.35*max(position.y,0.)');
  MAT.leaf=std({map:TEX.leaves,bumpMap:TEX.leaves,bumpScale:.05,roughness:.78,flatShading:true});windify(MAT.leaf,'.03*(position.y+.6)');
  MAT.hedge=std({map:TEX.leaves,bumpMap:TEX.leaves,bumpScale:.05,roughness:.85});
  MAT.soil=DECAL(std({map:TEX.soil,bumpMap:TEX.soil,bumpScale:.06}),1);
  MAT.birch=std({map:TEX.birch,bumpMap:TEX.birch,bumpScale:.02,roughness:.7});
  MAT.rock=std({map:TEX.stone,bumpMap:TEX.stone,bumpScale:.06,flatShading:true});
  MAT.fern=std({map:TEX.fern,alphaTest:.45,side:THREE.DoubleSide,roughness:.8});windify(MAT.fern,'.25*max(position.y,0.)');
  MAT.cap=std({roughness:.5});MAT.stem=std({color:0xe8dfcc,roughness:.8});
  MAT.plank=std({map:TEX.wood,bumpMap:TEX.wood,bumpScale:.02,roughness:.8});
  MAT.mount=new THREE.MeshBasicMaterial({color:0x445066,fog:false,vertexColors:true});MAT.snow=MAT.mount;
  MAT.river=new THREE.ShaderMaterial({uniforms:{uT:WIND,sky:{value:new THREE.Color()},deep:{value:new THREE.Color(0x0a2a36)},sunCol:{value:new THREE.Color()}},toneMapped:false,
    vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,fragmentShader:'uniform float uT;uniform vec3 sky,deep,sunCol;varying vec3 vW;void main(){float z=vW.z-uT*.9;float r=sin(z*6.+sin(vW.x*5.)*1.5)*.5+sin(z*11.3+vW.x*3.)*.3+sin(z*2.2)*.2;vec3 c=mix(deep,sky,.42+r*.14);c+=vec3(.8,.9,1.)*smoothstep(.72,1.,r)*.18;c+=sunCol*smoothstep(.85,1.,r)*.3;gl_FragColor=vec4(c,1.);}'});
  MAT.bark=std({map:TEX.bark,bumpMap:TEX.bark,bumpScale:.03});
  MAT.flower=new THREE.PointsMaterial({size:.075,map:TEX.flower,vertexColors:true,alphaTest:.5});
  MAT.pond=new THREE.ShaderMaterial({uniforms:{uT:WIND,sky:{value:new THREE.Color()},deep:{value:new THREE.Color(0x0b2238)},sunCol:{value:new THREE.Color()}},toneMapped:false,
    vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,fragmentShader:'uniform float uT;uniform vec3 sky,deep,sunCol;varying vec3 vW;void main(){float r=sin(vW.x*7.3+uT*1.1+sin(vW.z*3.1))*.5+sin(vW.z*6.1-uT*.9+sin(vW.x*2.7))*.5+sin((vW.x-vW.z)*11.+uT*1.7)*.25;vec3 c=mix(deep,sky,.5+r*.1);float sp=smoothstep(.95,1.2,r)*.35;c+=sunCol*sp;gl_FragColor=vec4(c,1.);}'});
  const ro=new ResizeObserver(resize);ro.observe($('#view'));resize();
}
export function resize(){const r=$('#view').getBoundingClientRect();if(!r.width)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}

function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();if((o.isSprite||o.userData.ownMat)&&o.material)o.material.dispose();});}
export function sprite(tx,sx,sy,x,y,z){const m=new THREE.SpriteMaterial({map:tx,transparent:true,toneMapped:false});if(tx.premultiplyAlpha){m.blending=THREE.CustomBlending;m.blendSrc=THREE.OneFactor;m.blendDst=THREE.OneMinusSrcAlphaFactor;m.blendSrcAlpha=THREE.OneFactor;m.blendDstAlpha=THREE.OneMinusSrcAlphaFactor;}const s=new THREE.Sprite(m);s.scale.set(sx,sy,1);s.position.set(x,y,z);return s;}
export function glowSprite(col,sc,x,y,z,op=1){const s=sprite(TEX.glow,sc,sc,x,y,z);Object.assign(s.material,{blending:THREE.AdditiveBlending,depthWrite:false,opacity:op});s.material.color.set(col);return s;}
export function blob(x,z,r){const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),DECAL(new THREE.MeshBasicMaterial({map:TEX.blob,transparent:true,depthWrite:false}),3));m.userData.ownMat=1;m.rotation.x=-Math.PI/2;m.position.set(x,.016,z);m.renderOrder=2;return m;}

// ---- house variety: each style = facade palette, timber pattern, storeys, windows, roof ----
const HSTY=[
 {pl:'#cdbb94',tb:'#3d2a1c',pat:'x',fl:1,win:'sq',sh:'#3f6b3a',box:0,base:0,roof:0,h:1.25,p:1},
 {pl:'#c9a35e',tb:'#4a3020',pat:'studs',fl:2,win:'sq',sh:null,box:1,base:0,roof:1,h:1.62,p:.85},
 {pl:'#e4ddcc',tb:'#22180f',pat:'diamond',fl:1,win:'arch',sh:'#365a86',box:0,base:1,roof:2,h:1.3,p:1.3},
 {pl:'#cfa597',tb:'#3a2418',pat:'x',fl:2,win:'dbl',sh:null,box:1,base:0,roof:0,h:1.72,p:1},
 {pl:'stone',tb:'#2c241c',pat:'none',fl:1,win:'arch',sh:null,box:0,base:0,roof:1,h:1.42,p:1.15},
 {pl:'#a9b394',tb:'#3d2a1c',pat:'studs',fl:1,win:'sq',sh:'#8a3328',box:1,base:1,roof:0,h:1.18,p:.8},
 {pl:'#d8c49a',tb:'#3a2a1c',pat:'diamond',fl:2,win:'sq',sh:'#6a4a8a',box:0,base:1,roof:2,h:1.66,p:1.1},
 {pl:'#ece6d8',tb:'#2b3550',pat:'x',fl:1,win:'dbl',sh:'#2f5d7c',box:1,base:0,roof:1,h:1.28,p:.95}
];
function houseLayout(st,door){const W=128,H=Math.round(128*st.h/1.25),base=st.base?Math.round(H*.17):0,beam=st.pat==='none'?0:7;
  const bands=[];const top=beam,bot=H-base-(beam?8:0),bh=(bot-top)/st.fl;for(let f=0;f<st.fl;f++)bands.push([top+f*bh,top+(f+1)*bh]);
  const wins=[];bands.forEach(([y0,y1],f)=>{const ground=f===st.fl-1;const wh=(y1-y0)*(st.fl>1?.5:.46),cy=y0+(y1-y0)*.47;
    if(door&&ground){wins.push({door:1,x:64-15,y:y1-(y1-y0)*.78+(base?0:2),w:30,h:(y1-y0)*.78+(base?base*.0:0)});return;}
    const xs=st.win==='dbl'?[36,92]:[64],ww=st.win==='dbl'?24:34;xs.forEach(cx=>wins.push({x:cx-ww/2,y:cy-wh/2,w:ww,h:wh,arch:st.win==='arch'}));});
  return{W,H,base,beam,bands,wins,bot};}
function paneShape(g,o){if(o.arch){const r=o.w/2;g.beginPath();g.moveTo(o.x,o.y+o.h);g.lineTo(o.x,o.y+r);g.arc(o.x+r,o.y+r,r,Math.PI,0);g.lineTo(o.x+o.w,o.y+o.h);g.closePath();}else{g.beginPath();g.rect(o.x,o.y,o.w,o.h);}}
function houseTex(si,door){const st=HSTY[si],Lh=houseLayout(st,door);
  const map=tex(Lh.W,Lh.H,(g,w,h,r)=>{
    const stones=(y0,y1,c1,c2)=>{for(let y=y0,row=0;y<y1;row++){const rh=9+(r()*5|0);let x=-(r()*14|0);while(x<w){const bw=12+(r()*16|0),s=.72+r()*.38;const c=new THREE.Color(c1).lerp(new THREE.Color(c2),r());g.fillStyle=`rgb(${c.r*255*s|0},${c.g*255*s|0},${c.b*255*s|0})`;
      const hh=Math.min(rh-2,y1-y-1);g.beginPath();g.moveTo(x+2,y+1);g.lineTo(x+bw-1,y+1);g.lineTo(x+bw-1,y+hh);g.lineTo(x+1,y+hh);g.closePath();g.fill();g.fillStyle='rgba(255,240,215,.10)';g.fillRect(x+2,y+1,bw-3,1.5);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+1,y+hh-1.5,bw-2,1.5);x+=bw;}y+=rh;}};
    if(st.pl==='stone'){g.fillStyle='#2b2620';g.fillRect(0,0,w,h);stones(0,h,'#7f735f','#5c564d');speck(g,w,h,r,900,.06);}
    else{g.fillStyle=st.pl;g.fillRect(0,0,w,h);speck(g,w,h,r,1500,.07);const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(0,0,0,.12)');gr.addColorStop(.25,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(40,30,20,.18)');g.fillStyle=gr;g.fillRect(0,0,w,h);
      if(Lh.base){g.fillStyle='#2b2620';g.fillRect(0,h-Lh.base,w,Lh.base);stones(h-Lh.base,h,'#7d725f','#5e5850');}}
    const T=st.tb;g.fillStyle=T;g.strokeStyle=T;g.lineCap='square';
    if(Lh.beam){g.fillRect(0,0,w,Lh.beam);g.fillRect(0,Lh.bot,w,8);g.fillRect(0,0,7,Lh.bot);g.fillRect(w-7,0,7,Lh.bot);
      Lh.bands.forEach(([y0,y1],f)=>{if(f)g.fillRect(0,y0-3,w,6);g.lineWidth=6;g.beginPath();
        if(st.pat==='x'){g.moveTo(7,y1);g.lineTo(30,y0+6);g.moveTo(w-7,y1);g.lineTo(w-30,y0+6);}
        else if(st.pat==='studs'){[22,w-22].forEach(x=>{g.moveTo(x,y0);g.lineTo(x,y1);});}
        else if(st.pat==='diamond'){const my=(y0+y1)/2;g.moveTo(7,my);g.lineTo(20,y0+4);g.moveTo(7,my);g.lineTo(20,y1-4);g.moveTo(w-7,my);g.lineTo(w-20,y0+4);g.moveTo(w-7,my);g.lineTo(w-20,y1-4);}
        g.stroke();});}
    else{g.fillStyle='#2c2620';g.fillRect(0,h-6,w,6);}
    Lh.wins.forEach(o=>{
      if(o.door){g.fillStyle='#1c130c';g.fillRect(o.x-4,o.y-4,o.w+8,o.h+4);g.beginPath();g.moveTo(o.x,o.y+o.h);g.lineTo(o.x,o.y+o.w/2);g.arc(o.x+o.w/2,o.y+o.w/2,o.w/2,Math.PI,0);g.lineTo(o.x+o.w,o.y+o.h);g.closePath();
        const dc=['#5a3a22','#3f5a3a','#6b2f24','#2f4660'][si%4];g.fillStyle=dc;g.fill();g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=1.5;for(let x=o.x+6;x<o.x+o.w;x+=6){g.beginPath();g.moveTo(x,o.y+4);g.lineTo(x,o.y+o.h);g.stroke();}
        g.fillStyle='#1a1410';[o.y+o.h*.3,o.y+o.h*.72].forEach(y=>g.fillRect(o.x+2,y,o.w-4,3));g.fillStyle='#c9973f';g.beginPath();g.arc(o.x+o.w-7,o.y+o.h*.55,2,0,7);g.fill();
        g.fillStyle='#6d665c';g.fillRect(o.x-6,o.y+o.h-1,o.w+12,4);return;}
      if(st.sh){g.fillStyle=st.sh;[o.x-11,o.x+o.w+2].forEach(x=>{g.fillRect(x,o.y,9,o.h);g.fillStyle='rgba(0,0,0,.28)';for(let y=o.y+4;y<o.y+o.h;y+=5)g.fillRect(x,y,9,1.4);g.fillStyle=st.sh;});}
      g.fillStyle='#21160e';paneShape(g,{x:o.x-3,y:o.y-3,w:o.w+6,h:o.h+5,arch:o.arch});g.fill();
      const gg=g.createLinearGradient(0,o.y,0,o.y+o.h);gg.addColorStop(0,'#5d4a36');gg.addColorStop(1,'#2e231a');g.fillStyle=gg;paneShape(g,o);g.fill();
      g.fillStyle='rgba(255,240,210,.18)';g.fillRect(o.x+3,o.y+(o.arch?o.w/2:3),3,o.h*.4);
      g.fillStyle='#21160e';g.fillRect(o.x+o.w/2-1.5,o.y,3,o.h);g.fillRect(o.x,o.y+o.h*.52,o.w,3);
      g.fillStyle='#8a7e6c';g.fillRect(o.x-4,o.y+o.h+1,o.w+8,3);
      if(st.box){g.fillStyle='#4a2e1a';g.fillRect(o.x-2,o.y+o.h+3,o.w+4,6);const fc=['#d8545a','#e8c170','#e88fb0','#f2efe6','#b070d0'];
        for(let i=0;i<10;i++){const fx=o.x+r()*o.w,fy=o.y+o.h+1+r()*3;g.fillStyle='#4f7a3a';g.fillRect(fx-1,fy,3,3);g.fillStyle=fc[(r()*fc.length)|0];g.fillRect(fx,fy-2,2.5,2.5);}}});
  },300+si*7+(door?3:0));
  const glow=tex(Lh.W,Lh.H,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);Lh.wins.forEach(o=>{if(o.door)return;const gr=g.createRadialGradient(o.x+o.w/2,o.y+o.h*.55,1,o.x+o.w/2,o.y+o.h*.55,o.h*.8);gr.addColorStop(0,'#ffd88a');gr.addColorStop(1,'#5a2a00');g.fillStyle=gr;paneShape(g,o);g.fill();g.fillStyle='#000';g.fillRect(o.x+o.w/2-1.5,o.y,3,o.h);g.fillRect(o.x,o.y+o.h*.52,o.w,3);});},5);
  return{map,glow};}
function roofTex(kind){
  if(kind===1)return tex(128,128,(g,w,h,r)=>{g.fillStyle='#14171c';g.fillRect(0,0,w,h);for(let row=0;row<11;row++){const off=(row%2)*7;for(let x=-14;x<w+14;x+=14){const s=r()*.3+.72;const gr=g.createLinearGradient(0,row*12,0,row*12+12);gr.addColorStop(0,`rgb(${92*s|0},${102*s|0},${118*s|0})`);gr.addColorStop(1,`rgb(${50*s|0},${56*s|0},${66*s|0})`);g.fillStyle=gr;g.fillRect(x+off+.5,row*12,13,11);}}speck(g,w,h,r,600,.06);},41,true);
  return tex(128,128,(g,w,h,r)=>{g.fillStyle='#5a4523';g.fillRect(0,0,w,h);const cs=['#b8964e','#9c7a3a','#d2b06a','#7d6130','#c4a25a'];
    for(let i=0;i<1700;i++){const x=r()*w,y=r()*h,l=8+r()*14;g.strokeStyle=cs[(r()*cs.length)|0];g.globalAlpha=.55+r()*.45;g.lineWidth=1+r();g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*2,y+l);g.stroke();}
    g.globalAlpha=1;for(let y=0;y<h;y+=32){const gr=g.createLinearGradient(0,y+20,0,y+32);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(30,18,6,.55)');g.fillStyle=gr;g.fillRect(0,y+20,w,12);}},43,true);}
function houseMats(){if(MAT.hv)return MAT.hv;MAT.hv=HSTY.map((st,i)=>[0,1].map(d=>{const t=houseTex(i,d);return hstd({map:t.map,bumpMap:t.map,bumpScale:.025,emissiveMap:t.glow,emissive:0xffa040,emissiveIntensity:0});}));
  MAT.roofV=[MAT.roof,hstd({map:roofTex(1),bumpMap:roofTex(1),bumpScale:.03,roughness:.6,metalness:.05}),hstd({map:roofTex(2),bumpMap:roofTex(2),bumpScale:.05,roughness:.95})];
  MAT.chim=hstd({color:0x6e655a,map:TEX.stone||null,roughness:.95});MAT.chimCap=hstd({color:0x2d2925,roughness:.9});return MAT.hv;}
const hstd=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.9,metalness:0},o));
// group tiles into house-sized blocks so neighbouring tiles share a style
const houseStyle=(x,y)=>{const bx=Math.floor((x+(Math.floor(y/3)%2))/3),by=Math.floor(y/3);return Math.floor(hash2(bx,by,7)*HSTY.length)%HSTY.length;};
function buildHouses(walls,wallAt){const hv=houseMats();const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sv=new THREE.Vector3(),pv=new THREE.Vector3();
  const groups={};walls.forEach(([x,y])=>{const s=houseStyle(x,y),d=hash2(x,y,13)<.22?1:0;(groups[s+':'+d]=groups[s+':'+d]||[]).push([x,y,s]);});
  Object.entries(groups).forEach(([k,list])=>{const [s,d]=k.split(':').map(Number),st=HSTY[s];const box=new THREE.BoxGeometry(1,st.h,1);
    const inst=new THREE.InstancedMesh(box,hv[s][d],list.length);list.forEach(([x,y],i)=>{m4.makeTranslation(x+.5,st.h/2,y+.5);inst.setMatrixAt(i,m4);});inst.castShadow=inst.receiveShadow=true;world.add(inst);});
  const shp=new THREE.Shape();shp.moveTo(-.56,0);shp.lineTo(.56,0);shp.lineTo(0,.42);shp.closePath();
  const rg=new THREE.ExtrudeGeometry(shp,{depth:1,bevelEnabled:false});rg.translate(0,0,-.5);
  [0,1,2].forEach(rk=>{const list=walls.filter(([x,y])=>HSTY[houseStyle(x,y)].roof===rk);if(!list.length)return;const roofs=new THREE.InstancedMesh(rg,MAT.roofV[rk],list.length);
    list.forEach(([x,y],i)=>{const st=HSTY[houseStyle(x,y)];const nx=(wallAt(x-1,y)?1:0)+(wallAt(x+1,y)?1:0),nz=(wallAt(x,y-1)?1:0)+(wallAt(x,y+1)?1:0);e.set(0,nx>nz?Math.PI/2:0,0);q.setFromEuler(e);sv.set(1,st.p,1);pv.set(x+.5,st.h,y+.5);m4.compose(pv,q,sv);roofs.setMatrixAt(i,m4);});
    roofs.castShadow=roofs.receiveShadow=true;world.add(roofs);});
  const chs=walls.filter(([x,y])=>hash2(x,y,11)<.13);if(chs.length){const cg=new THREE.BoxGeometry(.14,.42,.14),capg=new THREE.BoxGeometry(.19,.05,.19);
    const ci=new THREE.InstancedMesh(cg,MAT.chim,chs.length),cc=new THREE.InstancedMesh(capg,MAT.chimCap,chs.length);
    chs.forEach(([x,y],i)=>{const st=HSTY[houseStyle(x,y)];const ox=(hash2(x,y,17)-.5)*.36,oz=(hash2(x,y,19)-.5)*.36,b=st.h+.18+.1*st.p;m4.makeTranslation(x+.5+ox,b,y+.5+oz);ci.setMatrixAt(i,m4);m4.makeTranslation(x+.5+ox,b+.23,y+.5+oz);cc.setMatrixAt(i,m4);});
    ci.castShadow=cc.castShadow=true;world.add(ci);world.add(cc);}
}

export function buildLevel(){
  if(world){scene.remove(world);disposeGroup(world);}
  world=new THREE.Group();scene.add(world);
  ensureRoamers();dyn.roam={};
  dyn.gates=[];dyn.sprites=[];dyn.altar=null;dyn.shrine=null;dyn.shrineGlow=null;dyn.lamps=[];dyn.rings=[];dyn.water=null;dyn.glints=[];
  const L=LEVELS[S.lvl];const out=!!L.outdoor;
  const wh=out?1.25:1;
  const walls=[];
  const wallAt=(x,y)=>tile(x,y)==='#';
  const W=L.W,H=L.H;const NAT=NATS;const nature=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const c=tile(x,y),cx=x+.5,cz=y+.5;
    if(c==='#'){walls.push([x,y]);continue;}
    if(NAT.includes(c)){nature.push([x,y,c]);continue;}
    const horiz=wallAt(x-1,y)&&wallAt(x+1,y);
    switch(c){
      case'I':world.add(sprite(labelTex('INN','☾','#e8c170'),.62,.31,cx,.82,cz));break;
      case'S':world.add(sprite(labelTex('ARMS','⚔','#e8c170'),.62,.31,cx,.82,cz));break;
      case'T':world.add(sprite(labelTex('TEMPLE','☀','#e8c170'),.62,.31,cx,.82,cz));break;
      case'G':world.add(sprite(labelTex('GUILD','✶','#b8c6e8'),.62,.31,cx,.82,cz));break;
      case'>':{const h=new THREE.Mesh(new THREE.CircleGeometry(.34,32),MAT.hole);h.rotation.x=-Math.PI/2;h.position.set(cx,.012,cz);world.add(h);
        const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.42,40),DECAL(new THREE.MeshBasicMaterial({color:0xe8b050,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),4));ring.userData.ownMat=1;ring.rotation.x=-Math.PI/2;ring.position.set(cx,.02,cz);world.add(ring);dyn.rings.push(ring);
        world.add(glowSprite(0xe8a040,.9,cx,.12,cz,.35));world.add(sprite(labelTex('DESCEND','▼','#e8c170'),.5,.25,cx,.66,cz));break;}
      case'<':{world.add(sprite(labelTex('ASCEND','▲','#e8c170'),.5,.25,cx,.72,cz));const s=glowSprite(0xbfd0ff,1.1,cx,.9,cz,.25);world.add(s);break;}
      case'C':{const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.42,.2,.28),MAT.wood);b.position.y=.1;const lid=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.42,14,1,false,0,Math.PI),MAT.wood);lid.rotation.z=Math.PI/2;lid.position.y=.2;g.add(b,lid);g.position.set(cx,0,cz);g.rotation.y=.3;world.add(g);world.add(blob(cx,cz,.34));
        const gl=glowSprite(0xffe2a0,.18,cx+.08,.3,cz,.9);world.add(gl);dyn.glints.push(gl);break;}
      case'1':case'2':{const p=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.36,12),MAT.pedestal);p.position.set(cx,.18,cz);world.add(p);const o=sprite(c==='1'?orbTex('#e8c170','rgba(201,151,63,0)'):orbTex('#b8c6e8','rgba(120,150,220,0)'),.3,.3,cx,.5,cz);o.userData.bob=1;world.add(o);dyn.sprites.push(o);world.add(glowSprite(c==='1'?0xe8b050:0x8fb0ff,1,cx,.5,cz,.45));break;}
      case'N':{const s=sprite(monTex('npc'),.62,.62,cx,.31,cz);world.add(s);world.add(blob(cx,cz,.26));break;}
      case'E':case'B':{const grp=c==='B'?['regent']:L.fixed[FIXED_IDX[S.lvl][x+','+y]];const t=grp[0];const sc=c==='B'?1.05:.66;const s=sprite(monTex(t),sc,sc,cx,sc/2,cz);s.userData.bob=1;s.userData.base=sc/2;world.add(s);dyn.sprites.push(s);world.add(blob(cx,cz,sc*.42));if(c==='B')world.add(glowSprite(0x7a50d0,2.2,cx,.6,cz,.35));break;}
      case'F':{const b=new THREE.Mesh(new THREE.CylinderGeometry(.34,.38,.2,24),MAT.basin);b.position.set(cx,.1,cz);world.add(b);const w=new THREE.Mesh(new THREE.CircleGeometry(.29,24),MAT.water);w.rotation.x=-Math.PI/2;w.position.set(cx,.205,cz);world.add(w);dyn.water=w;world.add(glowSprite(0x5a9aff,.8,cx,.28,cz,.35));break;}
      case'A':{const p=new THREE.Mesh(new THREE.BoxGeometry(.5,.45,.5),MAT.pedestal);p.position.set(cx,.225,cz);world.add(p);const o=sprite(orbTex('#c9b6ff','rgba(120,90,220,0)'),.34,.34,cx,.62,cz);o.userData.bob=1;world.add(o);dyn.altar=o;world.add(glowSprite(0x9a70ff,1.4,cx,.62,cz,.4));break;}
      case'=':{const d=new THREE.Group();[-1,1].forEach(sd=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.1,1.3,.1),MAT.wood);post.position.set(horiz?sd*.45:0,.65,horiz?0:sd*.45);post.castShadow=true;d.add(post);});const beam=new THREE.Mesh(new THREE.BoxGeometry(horiz?1.1:.12,.12,horiz?.12:1.1),MAT.wood);beam.position.y=1.28;beam.castShadow=true;d.add(beam);d.position.set(cx,0,cz);world.add(d);
        const dest=LEVELS[L.link]||LEVELS[0];world.add(sprite(labelTex(dest.name.replace('The ','').toUpperCase(),'',dest.outdoor?'#e8c170':'#b8c6e8'),.66,.33,cx,1.02,cz));break;}
      case'K':{const d=new THREE.Mesh(new THREE.BoxGeometry(1,1,.1),MAT.iron);d.position.set(cx,.5,cz);if(!horiz)d.rotation.y=Math.PI/2;world.add(d);break;}
      case'M':case'U':{const m=new THREE.MeshBasicMaterial({map:TEX.bars,color:c==='M'?0x9db6e8:0xe8c170,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});const d=new THREE.Mesh(new THREE.BoxGeometry(1,1,.05),m);d.userData.ownMat=1;d.position.set(cx,.5,cz);if(!horiz)d.rotation.y=Math.PI/2;world.add(d);dyn.gates.push({mesh:d,type:c});break;}
    }
    // lamps (town) and sconces (dungeons) on walls beside floor tiles
    if(c==='.'){
      const nb=[[0,-1],[1,0],[0,1],[-1,0]].filter(([dx,dy])=>wallAt(x+dx,y+dy)||(out&&NAT.includes(tile(x+dx,y+dy))));
      const pickIt=out?(S.lvl===0&&(x*73+y*151)%7===0):((x*37+y*91)%5===0);
      if(nb.length&&pickIt){const [dx,dy]=nb[(x+y)%nb.length];
        if(out){const px=cx+dx*.44,pz=cz+dy*.44;const post=new THREE.Mesh(new THREE.CylinderGeometry(.018,.022,.95,6),MAT.post);post.position.set(px,.475,pz);world.add(post);
          const arm=new THREE.Mesh(new THREE.BoxGeometry(.02,.02,.14),MAT.post);arm.position.set(px-dx*.07,.93,pz-dy*.07);arm.rotation.y=dx?Math.PI/2:0;world.add(arm);
          const lx=px-dx*.13,lz=pz-dy*.13;const lan=new THREE.Mesh(new THREE.BoxGeometry(.06,.08,.06),MAT.lantern);lan.position.set(lx,.87,lz);world.add(lan);
          const glow=glowSprite(0xffb050,.7,lx,.87,lz,0);world.add(glow);
          const pool=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),DECAL(new THREE.MeshBasicMaterial({map:TEX.glow,color:0xff9a3a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}),4));pool.userData.ownMat=1;pool.rotation.x=-Math.PI/2;pool.position.set(lx,.018,lz);world.add(pool);
          dyn.lamps.push({pos:new THREE.Vector3(lx,.87,lz),glow,pool,phase:x*3+y});}
        else{const col=S.lvl===2?0xa080ff:0xffa040;const px=cx+dx*.46,pz=cz+dy*.46;
          const br=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,.06),MAT.post);br.position.set(px,.56,pz);world.add(br);
          const fl=sprite(TEX.flame,.1,.2,px-dx*.02,.68,pz-dy*.02);Object.assign(fl.material,{blending:THREE.AdditiveBlending,depthWrite:false});fl.material.color.set(S.lvl===2?0xc0a0ff:0xffffff);world.add(fl);
          const glow=glowSprite(col,.9,px-dx*.04,.66,pz-dy*.04,.5);world.add(glow);
          dyn.lamps.push({pos:new THREE.Vector3(px-dx*.12,.66,pz-dy*.12),glow,flame:fl,phase:x*5+y*3,col});}}
    }
  }
  if(L.wall==='house')buildHouses(walls,wallAt);else{
  const box=new THREE.BoxGeometry(1,wh,1);
  const inst=new THREE.InstancedMesh(box,MAT[L.wall],walls.length);const m4=new THREE.Matrix4();
  walls.forEach(([x,y],i)=>{m4.makeTranslation(x+.5,wh/2,y+.5);inst.setMatrixAt(i,m4);});
  inst.castShadow=out;inst.receiveShadow=out;world.add(inst);
  if(out){ // pitched roofs, ridge follows the longer run of houses
    const shp=new THREE.Shape();shp.moveTo(-.56,0);shp.lineTo(.56,0);shp.lineTo(0,.42);shp.closePath();
    const rg=new THREE.ExtrudeGeometry(shp,{depth:1,bevelEnabled:false});rg.translate(0,0,-.5);
    const roofs=new THREE.InstancedMesh(rg,MAT.roof,walls.length);const q=new THREE.Quaternion(),e=new THREE.Euler(),sv=new THREE.Vector3(1,1,1),pv=new THREE.Vector3();
    walls.forEach(([x,y],i)=>{const nx=(wallAt(x-1,y)?1:0)+(wallAt(x+1,y)?1:0),nz=(wallAt(x,y-1)?1:0)+(wallAt(x,y+1)?1:0);e.set(0,nx>nz?Math.PI/2:0,0);q.setFromEuler(e);pv.set(x+.5,wh,y+.5);m4.compose(pv,q,sv);roofs.setMatrixAt(i,m4);});
    roofs.castShadow=true;roofs.receiveShadow=true;world.add(roofs);
  }
  }
  const fm=new THREE.MeshStandardMaterial({map:TEX[L.floor],bumpMap:TEX[L.floor],bumpScale:.04,roughness:out?.85:.5,metalness:out?0:.15});
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,H),fm);fl.userData.ownMat=1;fm.map.repeat.set(W,H);fl.rotation.x=-Math.PI/2;fl.position.set(W/2,0,H/2);fl.receiveShadow=out;world.add(fl);dyn.floorMat=out?fm:null;
  if(L.ceil){const cm=new THREE.MeshStandardMaterial({map:TEX[L.ceil],bumpMap:TEX[L.ceil],bumpScale:.04,roughness:.95});const ce=new THREE.Mesh(new THREE.PlaneGeometry(W,H),cm);ce.userData.ownMat=1;cm.map.repeat.set(W,H);ce.rotation.x=Math.PI/2;ce.position.set(W/2,1,H/2);world.add(ce);}
  dyn.mounts=[];if(out){const R2=Math.max(W,H)*.75+26;
    const mkMount=snowy=>{const g2=new THREE.ConeGeometry(1,1,7,4).toNonIndexed();const pa=g2.attributes.position,cols=[];for(let k=0;k<pa.count;k++){const y=pa.getY(k)+.5;const v=hash2(Math.round(pa.getX(k)*50),Math.round(pa.getZ(k)*50))*.08;
        if(snowy&&y>.72){cols.push(1.55,1.6,1.7);}else{const t=.55+y*.4+v;cols.push(t*.86,t*.9,t);}}g2.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));return g2;};
    const gPlain=mkMount(false),gSnow=mkMount(true);
    for(let i=0;i<34;i++){const a=i/34*Math.PI*2+hash2(i,S.lvl)*.15,rr=R2+hash2(i,2)*14,hh=9+hash2(i,3)*16,rad=8+hash2(i,4)*9;
      const m=new THREE.Mesh(hh>17?gSnow:gPlain,MAT.mount);m.scale.set(rad,hh,rad);m.position.set(W/2+Math.cos(a)*rr,hh/2-1,H/2+Math.sin(a)*rr);m.rotation.y=hash2(i,5)*3;m.renderOrder=-6;world.add(m);}}
  if(out){ // meadow and a forest belt beyond the town edge
    const og=new THREE.Mesh(new THREE.PlaneGeometry(W+60,H+60),new THREE.MeshStandardMaterial({map:TEX.grass,bumpMap:TEX.grass,bumpScale:.03,roughness:.95}));og.userData.ownMat=1;og.material.map=TEX.grass.clone();og.material.map.needsUpdate=true;og.material.map.repeat.set(W+60,H+60);og.rotation.x=-Math.PI/2;og.position.set(W/2,-.05,H/2);og.receiveShadow=true;world.add(og);
    for(let y=-4;y<H+4;y++)for(let x=-4;x<W+4;x++){if(inMap(x,y))continue;if(hash2(x,y,99)<.7)nature.push([x,y,'v']);}
  }
  if(nature.length)buildNature(nature);
  const R=Math.max(W,H)/2+2,sc=sun.shadow.camera;sc.left=-R;sc.right=R;sc.top=R;sc.bottom=-R;sc.far=90;sc.updateProjectionMatrix();sun.target.position.set(W/2,0,H/2);moonLight.target.position.set(W/2,0,H/2);
  [sky,sunSpr,moonSpr,clouds,stars].forEach(o=>o.visible=out);
  sun.castShadow=out;
  scene.fog=new THREE.Fog(0x000000,out?8:1.4,out?38:7.5);
  torch.color.setHex(L.torch||0xffb060);
  dust.material.color.set(out?0xd8ff8a:(S.lvl===2?0xb8a0ff:0xffd0a0));
  placeLore();PERF.sunKey='';Bus.emit('hud');
}

function lumpy(geo,amt,seed){const p=geo.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=hash2(Math.round(v.x*97)+seed,Math.round(v.y*89)+Math.round(v.z*83));v.multiplyScalar(1+(k-.5)*amt);p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();return geo;}
function buildNature(list){
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sv=new THREE.Vector3(),pv=new THREE.Vector3(),col=new THREE.Color();
  const put=(im,i,x,y,z,ry,sx,sy,sz,rx=0,rz=0)=>{e.set(rx,ry,rz);q.setFromEuler(e);pv.set(x,y,z);sv.set(sx,sy,sz);m4.compose(pv,q,sv);im.setMatrixAt(i,m4);};
  const pool=(geo,mat,n)=>{const im=new THREE.InstancedMesh(geo,mat,Math.max(1,n));im.count=0;im.castShadow=true;im.receiveShadow=true;return im;};
  const add=(im,x,y,z,ry,sx,sy,sz,c,rx,rz)=>{const i=im.count++;put(im,i,x,y,z,ry,sx,sy,sz,rx,rz);if(c!=null){col.setHSL(c[0],c[1],c[2]);im.setColorAt(i,col);}};
  const byType=t=>list.filter(v=>v[2]===t);
  const soilSet=list.filter(v=>v[2]==='c'),waterSet=list.filter(v=>v[2]==='w'||v[2]==='r'||v[2]==='b');
  // ground
  const gp=new THREE.PlaneGeometry(1,1);gp.rotateX(-Math.PI/2);
  const grassTiles=list.filter(v=>!'cwrbY'.includes(v[2]));const groundTiles=grassTiles.filter(v=>v[2]!=='v');
  const ground=new THREE.InstancedMesh(gp,MAT.grass,Math.max(1,groundTiles.length));ground.count=0;
  groundTiles.forEach(([x,y])=>{const i=ground.count++;put(ground,i,x+.5,.01,y+.5,Math.floor(hash2(x,y)*4)*Math.PI/2,1,1,1);col.setHSL(.26+hash2(x,y,4)*.05,.35+hash2(x,y,5)*.15,.42+hash2(x,y,6)*.12);ground.setColorAt(i,col);});
  ground.receiveShadow=true;world.add(ground);
  if(soilSet.length){const sg=new THREE.InstancedMesh(gp,MAT.soil,soilSet.length);soilSet.forEach(([x,y],i)=>put(sg,i,x+.5,.01,y+.5,0,1,1,1));sg.receiveShadow=true;world.add(sg);}
  const isTree=c=>c==='t'||c==='y';
  const nearTree=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isTree(tile(x+dx,y+dy)));
  // ---- trees ----
  const trees=byType('t'),birches=byType('y'),belt=byType('v');
  const trunkG=new THREE.CylinderGeometry(.045,.1,1,7);trunkG.translate(0,.5,0);
  const trunks=pool(trunkG,MAT.bark,trees.length*2);const bTrunks=pool(trunkG,MAT.birch,birches.length*2);
  const blobG=lumpy(new THREE.IcosahedronGeometry(.34,1),.28,3),coneG=lumpy(new THREE.ConeGeometry(.4,.62,9,2),.12,5),smallG=lumpy(new THREE.IcosahedronGeometry(.2,1),.3,7);
  const blobs=pool(blobG,MAT.leaf,trees.length*6+byType('u').length*3),cones=pool(coneG,MAT.leaf,trees.length*4),small=pool(smallG,MAT.leaf,birches.length*7+list.length);
  const blobLo=lumpy(new THREE.IcosahedronGeometry(.36,0),.2,3),coneLo=new THREE.ConeGeometry(.4,.62,6,1);
  const trunksLo=pool(trunkG,MAT.bark,belt.length),blobsLo=pool(blobLo,MAT.leaf,belt.length*3),conesLo=pool(coneLo,MAT.leaf,belt.length*3);[trunksLo,blobsLo,conesLo].forEach(m=>m.castShadow=false);
  belt.forEach(([x,y])=>{const pine=hash2(x,y,3)<.45,s=.9+hash2(x,y,1)*.6,ox=x+.5+(hash2(x,y,5)-.5)*.4,oz=y+.5+(hash2(x,y,6)-.5)*.4;add(trunksLo,ox,0,oz,0,s,s,s);
    if(pine){for(let k=0;k<3;k++)add(conesLo,ox,(.6+k*.36)*s,oz,k,(1.2-k*.28)*s,s,(1.2-k*.28)*s,[.3,.38,.2+k*.04]);}else{for(let k=0;k<3;k++)add(blobsLo,ox+(hash2(x,y,10+k)-.5)*.35,(1.05+k*.22)*s,oz+(hash2(x,y,20+k)-.5)*.35,k,s*(1.3-k*.2),s,s*(1.3-k*.2),[.24+hash2(x,y,31)*.08,.42,.26+hash2(x,y,50+k)*.1]);}});
  trees.forEach(([x,y])=>{const pine=hash2(x,y,3)<(y<LH()*.3?.62:.34);const s=.85+hash2(x,y,1)*.55;const ox=x+.5+(hash2(x,y,5)-.5)*.3,oz=y+.5+(hash2(x,y,6)-.5)*.3;
    if(pine){add(trunks,ox,0,oz,0,s*.8,s*.9,s*.8);for(let k=0;k<4;k++){const w=(1.25-k*.24)*s;add(cones,ox,(.55+k*.3)*s,oz,hash2(x,y,k)*6,w,s*(1-k*.08),w,[.3+hash2(x,y,30)*.04,.38,.2+k*.035]);}}
    else{add(trunks,ox,0,oz,hash2(x,y,2)*6,s*1.1,s*(1+hash2(x,y,7)*.3),s*1.1);const hue=.22+hash2(x,y,31)*.1;
      for(let k=0;k<5;k++){const a=k/5*Math.PI*2+hash2(x,y,9),rr=k===4?0:.24*s;add(blobs,ox+Math.cos(a)*rr,(k===4?1.45:1.05+hash2(x,y,10+k)*.25)*s,oz+Math.sin(a)*rr,hash2(x,y,k)*6,s*(1+hash2(x,y,20+k)*.3),s*(.9+hash2(x,y,25+k)*.2),s*(1+hash2(x,y,20+k)*.3),[hue+hash2(x,y,40+k)*.03,.42+hash2(x,y,45)*.12,.26+hash2(x,y,50+k)*.12+(k===4?.06:0)]);}}});
  birches.forEach(([x,y])=>{const s=.8+hash2(x,y,1)*.4,ox=x+.5+(hash2(x,y,5)-.5)*.3,oz=y+.5+(hash2(x,y,6)-.5)*.3;add(bTrunks,ox,0,oz,hash2(x,y,2)*6,s*.55,s*1.5,s*.55,null,(hash2(x,y,8)-.5)*.12,(hash2(x,y,9)-.5)*.12);
    for(let k=0;k<7;k++){const a=k*2.4,rr=.12+hash2(x,y,60+k)*.2;add(small,ox+Math.cos(a)*rr*s,(1.05+k*.1+hash2(x,y,70+k)*.15)*s,oz+Math.sin(a)*rr*s,a,s*(1-k*.05),s*.9,s*(1-k*.05),[.2+hash2(x,y,80+k)*.04,.5,.42+hash2(x,y,90+k)*.1]);}});
  // ---- bushes (blocking) + decorative shrubs ----
  byType('u').forEach(([x,y])=>{for(let k=0;k<3;k++)add(blobs,x+.3+hash2(x,y,k)*.4,.22+k*.05,y+.3+hash2(x,y,k+3)*.4,k,.95+hash2(x,y,k+6)*.3,.75,.95,[.26+hash2(x,y,k)*.06,.45,.24+hash2(x,y,k+9)*.1]);});
  grassTiles.forEach(([x,y,c])=>{if((c===','||c==='f')&&hash2(x,y,111)<.1)add(small,x+.15+hash2(x,y,112)*.7,.1,y+.15+hash2(x,y,113)*.7,hash2(x,y,114)*6,1.1,.8,1.1,[.27,.45,.3]);});
  // ---- rocks & standing stones ----
  const rockG=lumpy(new THREE.DodecahedronGeometry(.3,1),.35,11);const rocks=pool(rockG,MAT.rock,list.length);
  byType('k').forEach(([x,y])=>{add(rocks,x+.5,.12,y+.5,hash2(x,y)*6,1.3+hash2(x,y,2)*.4,.9+hash2(x,y,3)*.4,1.2,[.1,.06,.45+hash2(x,y,4)*.1]);add(rocks,x+.2+hash2(x,y,5)*.2,.05,y+.75,1,.45,.35,.45,[.12,.05,.4]);});
  grassTiles.forEach(([x,y,c])=>{if(c!=='t'&&c!=='v'&&hash2(x,y,121)<.12)add(rocks,x+.1+hash2(x,y,122)*.8,.02,y+.1+hash2(x,y,123)*.8,hash2(x,y,124)*6,.25,.18,.25,[.1,.05,.42]);});
  const stoneG=lumpy(new THREE.BoxGeometry(.32,1.15,.22,2,4,2),.12,13);stoneG.translate(0,.55,0);const stones=pool(stoneG,MAT.rock,Math.max(1,byType('q').length));
  byType('q').forEach(([x,y])=>add(stones,x+.5,0,y+.5,Math.atan2(y-7,x-33)+Math.PI/2,1,1+hash2(x,y)*.3,1,[.33,.08,.46],(hash2(x,y,2)-.5)*.14,(hash2(x,y,3)-.5)*.14));
  // ---- ferns & mushrooms near trees ----
  const fernG=new THREE.PlaneGeometry(.42,.3);fernG.translate(0,.15,0);fernG.rotateX(-.35);const ferns=pool(fernG,MAT.fern,grassTiles.length*3);ferns.castShadow=false;
  const capG=new THREE.SphereGeometry(.05,10,6,0,Math.PI*2,0,Math.PI/2),stemG=new THREE.CylinderGeometry(.012,.016,.07,6);stemG.translate(0,.035,0);
  const caps=pool(capG,MAT.cap,grassTiles.length*2),stems=pool(stemG,MAT.stem,grassTiles.length*2);caps.castShadow=stems.castShadow=false;
  grassTiles.forEach(([x,y,c])=>{if(c!=='v'&&(c==='t'||c==='y'||c==='u'||nearTree(x,y))){for(let k=0;k<3;k++)if(hash2(x,y,130+k)<.55)add(ferns,x+.1+hash2(x,y,140+k)*.8,0,y+.1+hash2(x,y,150+k)*.8,hash2(x,y,160+k)*6.3,.8+hash2(x,y,170+k)*.6,.8+hash2(x,y,175+k)*.5,1,[.28+hash2(x,y,k)*.05,.5,.3+hash2(x,y,180+k)*.1]);
      if(hash2(x,y,190)<.28){for(let k=0;k<1+Math.floor(hash2(x,y,191)*3);k++){const mx=x+.15+hash2(x,y,200+k)*.7,mz=y+.15+hash2(x,y,210+k)*.7,sc=.7+hash2(x,y,220+k)*.8;add(stems,mx,0,mz,0,sc,sc,sc);add(caps,mx,.065*sc,mz,0,sc,sc*.7,sc,hash2(x,y,230)<.5?[.02,.7,.45]:[.08,.45,.4]);}}}});
  // ---- grass tufts, tall meadow grass, wheat ----
  const tp=new THREE.PlaneGeometry(.3,.26);tp.translate(0,.13,0);
  const tufts=pool(tp,MAT.tuft,grassTiles.length*17+soilSet.length*15+LW()*LH()*2);tufts.castShadow=false;
  const tuft=(x,y,k,h,cH)=>{const s=.7+hash2(x,y,k+60)*.7;add(tufts,x+.06+hash2(x,y,k)*.88,0,y+.06+hash2(x,y,k+30)*.88,hash2(x,y,k+90)*6.3,s,s*h,s,cH);};
  grassTiles.forEach(([x,y,c])=>{if(c==='m'){for(let k=0;k<16;k++)tuft(x,y,k,2.2+hash2(x,y,k+300)*.9,[.2+hash2(x,y,k+7)*.07,.45,.46+hash2(x,y,k+13)*.14]);}
    else{const n=(c===','||c==='f')?10:(c==='Y'||c==='v')?0:3;for(let k=0;k<n;k++)tuft(x,y,k,1+hash2(x,y,k+300)*.5,[.23+hash2(x,y,k+7)*.07,.5,.42+hash2(x,y,k+13)*.18]);}});
  soilSet.forEach(([x,y])=>{for(let row=0;row<3;row++)for(let k=0;k<5;k++){const s=.8+hash2(x,y,row*5+k)*.4;add(tufts,x+.12+k*.19+(hash2(x,y,k+row)-.5)*.05,0,y+.2+row*.3,hash2(x,y,k*7+row)*6,s,s*2.4,s,[.11+hash2(x,y,k+40)*.03,.55,.55+hash2(x,y,k+row+50)*.12]);}});
  // soften road edges with a few tufts
  for(let y=0;y<LH();y++)for(let x=0;x<LW();x++){if(tile(x,y)!=='.')continue;const nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>NATS.includes(tile(x+dx,y+dy))&&!'wrb'.includes(tile(x+dx,y+dy)));
    nb.forEach(([dx,dy],j)=>{for(let k=0;k<2;k++){const t=hash2(x,y,400+j*3+k);const px=x+.5+dx*.44+(dy?(t-.5)*.9:0),pz=y+.5+dy*.44+(dx?(t-.5)*.9:0);add(tufts,px,0,pz,t*6,.8,.9,.8,[.25,.45,.42]);}});}
  // ---- flowers ----
  const fls=byType('f').concat(byType('m').filter(([x,y])=>hash2(x,y,500)<.4));
  if(fls.length){const pal=[0xf2d15a,0xe86a8a,0xb88ae8,0xf4f0e6,0xe8804a,0x8ab8f0];const pos=[],cols=[];
    fls.forEach(([x,y,c])=>{const n=c==='f'?16:6,hy=c==='m'?.22:.08;for(let k=0;k<n;k++){pos.push(x+.06+hash2(x,y,k+100)*.88,hy+hash2(x,y,k+120)*.09,y+.06+hash2(x,y,k+140)*.88);col.setHex(pal[Math.floor(hash2(x,y,k+160)*pal.length)]).convertSRGBToLinear();cols.push(col.r,col.g,col.b);}});
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));world.add(new THREE.Points(g,MAT.flower));}
  // ---- water: pond & flowing river ----
  const pondT=byType('w'),riverT=waterSet.filter(v=>v[2]!=='w');
  const wp=new THREE.PlaneGeometry(1,1);wp.rotateX(-Math.PI/2);
  if(pondT.length){const pm=new THREE.InstancedMesh(wp,MAT.pond,pondT.length);pondT.forEach(([x,y],i)=>put(pm,i,x+.5,.02,y+.5,0,1,1,1));world.add(pm);}
  if(riverT.length){const rm=new THREE.InstancedMesh(wp,MAT.river,riverT.length);riverT.forEach(([x,y],i)=>put(rm,i,x+.5,.02,y+.5,0,1,1,1));world.add(rm);}
  const bank=pool(new THREE.DodecahedronGeometry(.09,0),MAT.rock,waterSet.length*8);
  waterSet.forEach(([x,y,c])=>{[[0,-1],[1,0],[0,1],[-1,0]].forEach(([dx,dy],k)=>{const n=tile(x+dx,y+dy);if('wrb'.includes(n))return;for(let j=0;j<2;j++){const t=hash2(x,y,k*3+j);add(bank,x+.5+dx*.5+(dy?(t-.5)*.8:0),.02,y+.5+dy*.5+(dx?(t-.5)*.8:0),t*6,1+t,.6+t*.5,1,[.1,.06,.36+t*.1]);}});});
  // ---- bridges ----
  byType('b').forEach(([x,y])=>{const ew=tile(x,y-1)==='r'||tile(x,y+1)==='r';const deck=new THREE.Mesh(new THREE.BoxGeometry(1,.06,.86),MAT.plank);deck.position.set(x+.5,.07,y+.5);if(!ew)deck.rotation.y=Math.PI/2;deck.castShadow=deck.receiveShadow=true;world.add(deck);
    [-1,1].forEach(sd=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(1,.05,.05),MAT.wood);const post=new THREE.Mesh(new THREE.BoxGeometry(.06,.3,.06),MAT.wood);if(ew){rail.position.set(x+.5,.32,y+.5+sd*.42);post.position.set(x+.5,.2,y+.5+sd*.42);}else{rail.rotation.y=Math.PI/2;rail.position.set(x+.5+sd*.42,.32,y+.5);post.position.set(x+.5+sd*.42,.2,y+.5);}rail.castShadow=post.castShadow=true;world.add(rail,post);});});
  // ---- shrine at the heart of the stone circle ----
  byType('Y').forEach(([x,y])=>{const d=new THREE.Mesh(new THREE.CylinderGeometry(.46,.5,.08,24),MAT.rock);d.position.set(x+.5,.04,y+.5);d.receiveShadow=true;world.add(d);
    const ring=new THREE.Mesh(new THREE.RingGeometry(.26,.34,32),new THREE.MeshBasicMaterial({color:0xe8c170,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));ring.userData.ownMat=1;ring.rotation.x=-Math.PI/2;ring.position.set(x+.5,.1,y+.5);DECAL(ring.material,5);world.add(ring);dyn.shrine=ring;dyn.rings.push(ring);
    const gl=glowSprite(0xe8c170,1.4,x+.5,.3,y+.5,.45);world.add(gl);dyn.shrineGlow=gl;});
  // ---- well & gravestones (town) ----
  byType('o').forEach(([x,y])=>{const cx=x+.5,cz=y+.5;const ring=new THREE.Mesh(new THREE.CylinderGeometry(.3,.33,.34,20,1,true),MAT.rock);ring.material.side=THREE.DoubleSide;ring.position.set(cx,.17,cz);ring.castShadow=true;world.add(ring);
    const wtr=new THREE.Mesh(new THREE.CircleGeometry(.29,20),new THREE.MeshBasicMaterial({color:0x061018}));wtr.userData.ownMat=1;wtr.rotation.x=-Math.PI/2;wtr.position.set(cx,.12,cz);world.add(wtr);
    [-1,1].forEach(sd=>{const post=new THREE.Mesh(new THREE.BoxGeometry(.05,.62,.05),MAT.wood);post.position.set(cx+sd*.28,.47,cz);world.add(post);});
    const roof=new THREE.Mesh(new THREE.ConeGeometry(.46,.28,4),MAT.roof);roof.rotation.y=Math.PI/4;roof.position.set(cx,.9,cz);roof.castShadow=true;world.add(roof);});
  byType('g').forEach(([x,y])=>{const st=new THREE.Mesh(new THREE.BoxGeometry(.3,.44,.08),MAT.rock);st.position.set(x+.5,.22,y+.5);st.rotation.set((hash2(x,y)-.5)*.15,(hash2(x,y,2)-.5)*.4,(hash2(x,y,3)-.5)*.12);st.castShadow=true;world.add(st);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,.08,16,1,false,0,Math.PI),MAT.rock);top.rotation.set(Math.PI/2,0,Math.PI/2);top.position.set(0,.22,0);st.add(top);});
  // hedges (town)
  const hedges=byType('h');if(hedges.length){const hg=new THREE.BoxGeometry(.98,.66,.98);hg.translate(0,.33,0);const hm=new THREE.InstancedMesh(hg,MAT.hedge,hedges.length);
    hedges.forEach(([x,y],i)=>{put(hm,i,x+.5,0,y+.5,0,1,.9+hash2(x,y)*.25,1);for(let k=0;k<2;k++)add(small,x+.25+hash2(x,y,k)*.5,.66+hash2(x,y,k+4)*.06,y+.25+hash2(x,y,k+8)*.5,hash2(x,y,k)*6,1.3,.9,1.3,[.27,.4,.3+hash2(x,y,k)*.08]);});hm.castShadow=hm.receiveShadow=true;world.add(hm);}
  [trunks,bTrunks,blobs,cones,small,rocks,stones,ferns,caps,stems,tufts,bank,trunksLo,blobsLo,conesLo].forEach(im=>{if(im.count>0)world.add(im);});
}
export function snapCamera(){yaw=-S.dir*Math.PI/2;FR.pitch=0;FR.spd=0;camera.position.set(S.x+.5,.5,S.y+.5);camera.rotation.set(0,yaw,0);anim.active=false;MV.q=null;MV.spd=0;MV.oy=MV.px=MV.rz=0;MV.fov=FOV0;if(camera.fov!==FOV0){camera.fov=FOV0;camera.updateProjectionMatrix();}}
const FOV0=72;
// continuous movement: real speed that carries across tiles, camera motion driven by distance walked
export const MV={q:null,lastEnd:0,spd:0,dist:0,oy:0,px:0,rz:0,fov:FOV0,lastT:0,carry:0,lastRel:-1,held:new Set()};
const MOVE_KEYS='wsqe';
const heldMove=()=>{for(const k of MV.held)if(MOVE_KEYS.includes(k))return k;return null;};
const heldAny=()=>{let r=null;for(const k of MV.held)r=k;return r;};
export function startAnim(toPos,toYaw,dur,done,o={}){const now=performance.now();anim.active=true;anim.t0=now;anim.dur=dur;anim.fp=camera.position.clone();anim.fp.y=.5;anim.tp=toPos;anim.fy=yaw;anim.ty=toYaw;anim.done=done;
  anim.walk=anim.fp.distanceToSquared(toPos)>.01;anim.kind=o.kind||(anim.walk?'walk':'turn');anim.rel=o.rel||0;anim.bdir=o.bdir||null;anim.s=0;
  if(anim.kind==='walk'){const chained=now-MV.lastEnd<40;if(chained&&MV.lastRel===anim.rel){anim.s=Math.min(.5,MV.carry);}else if(chained){MV.spd*=.45;}else MV.spd=Math.min(MV.spd,1.2);MV.lastRel=anim.rel;}
  else MV.lastRel=-1;MV.carry=0;}
const easeO=t=>1-Math.pow(1-t,3);
export function updateAnim(now){
  const dt=Math.min(.05,Math.max(0,(now-(MV.lastT||now))/1000));MV.lastT=now;
  let ty=0,tpx=0,trz=0,tfov=FOV0,rate=14;
  if(!anim.active){
    if(S.mode==='explore'){const b=now*.001;ty=Math.sin(b*1.7)*.0035;tpx=Math.sin(b*1.1)*.0022;trz=Math.sin(b*.8)*.0012;}
    MV.spd=0;rate=6;
    if(FR.on&&FR.spd>.05){const k=Math.min(1.1,FR.spd/3.2);MV.dist+=FR.spd*dt;const bob=(1-Math.cos(2*Math.PI*MV.dist))/2;ty=(bob*.019-.007)*k;trz=Math.sin(Math.PI*MV.dist)*.006*k;tfov=FOV0+1.6*k;rate=16;}
  }else if(anim.kind==='walk'){
    const fwd=anim.rel===0?1:anim.rel===2?-1:0;
    const cont=!!MV.q||!!heldMove();
    const VMAX=anim.rel===2?3.1:anim.rel===0?4.3:3.5,ACC=15,DEC=17;
    const rem=1-anim.s;const tgt=cont?VMAX:Math.min(VMAX,Math.sqrt(2*DEC*rem)+.3);
    MV.spd=MV.spd<tgt?Math.min(tgt,MV.spd+ACC*dt):Math.max(tgt,MV.spd-DEC*2*dt);
    anim.s+=MV.spd*dt;MV.dist+=MV.spd*dt;
    camera.position.lerpVectors(anim.fp,anim.tp,Math.min(1,anim.s));
    const k=Math.min(1.1,MV.spd/4.3),bob=(1-Math.cos(2*Math.PI*MV.dist))/2;
    ty=(bob*.019-.007)*k;
    trz=Math.sin(Math.PI*MV.dist)*.007*k+(anim.rel===1?-1:anim.rel===3?1:0)*.022*k;
    tpx=-fwd*.012*k;tfov=FOV0+(fwd>0?2.2:fwd<0?-1.2:.6)*k;rate=16;
  }else{
    const t=clamp((now-anim.t0)/anim.dur,0,1),bell=Math.sin(t*Math.PI);MV.spd=Math.max(0,MV.spd-20*dt);
    if(anim.kind==='turn'){const e=easeIO(t);yaw=anim.fy+(anim.ty-anim.fy)*e;camera.position.copy(anim.fp);
      const dir=Math.sign(anim.ty-anim.fy);trz=dir*bell*.03;ty=-bell*.006;tpx=bell*.008;tfov=FOV0+bell*1;rate=18;}
    else{const k=t<.35?easeO(t/.35):1-easeIO((t-.35)/.65);camera.position.copy(anim.fp).addScaledVector(anim.bdir,k*.11);
      const sh=t>.3&&t<.7?Math.sin(t*90)*(1-Math.abs(t-.5)*5)*.006:0;ty=-k*.012;tpx=k*.03+sh;trz=sh*1.5;tfov=FOV0-k*1.5;yaw=anim.fy;rate=30;}
    if(t>=1)anim.s=1;
  }
  const a=1-Math.exp(-dt*rate);MV.oy+=(ty-MV.oy)*a;MV.px+=(tpx-MV.px)*a;MV.rz+=(trz-MV.rz)*a;MV.fov+=(tfov-MV.fov)*a;
  camera.position.y=.5+MV.oy;camera.rotation.set(MV.px+(FR.on?FR.pitch:0),yaw,MV.rz,'YXZ');
  if(Math.abs(camera.fov-MV.fov)>.02){camera.fov=MV.fov;camera.updateProjectionMatrix();}
  if(anim.active&&anim.s>=1){const kind=anim.kind;anim.active=false;
    if(kind==='walk'){MV.carry=anim.s-1;camera.position.x=anim.tp.x;camera.position.z=anim.tp.z;}
    else if(kind==='bump'){camera.position.x=anim.fp.x;camera.position.z=anim.fp.z;}
    else yaw=anim.ty;
    MV.lastEnd=now;const d=anim.done;anim.done=null;d&&d();
    const q=MV.q;MV.q=null;const ok=canAct()&&!ui.menu&&ui.detail==null;
    if(q&&ok)q();
    else if(ok&&kind!=='bump'){const hk=kind==='walk'?heldMove():heldAny();if(hk&&KEYMAP[hk])KEYMAP[hk]();}
    if(!anim.active)MV.carry=0;}
}
export function queueAct(f){ // buffer the next action so chained input never waits for a full stop
  if(!S||S.mode!=='explore'||!anim.active||!$('#overlay').hidden||intro.active||sheet.i!=null)return false;
  const prog=anim.kind==='walk'?anim.s:(performance.now()-anim.t0)/anim.dur;if(prog<.25)return true;MV.q=f;return true;}

/* ------- lighting follows the clock ------- */
const cA=new THREE.Color(),cB=new THREE.Color(),cSky=new THREE.Color(),cHor=new THREE.Color(),cFog=new THREE.Color();
export function updateLighting(now){
  const L=LEVELS[S.lvl];const h=hourOf();const a=(h-6)/12*Math.PI;const elev=Math.sin(a);const f=clamp(elev*1.8,0,1);const night=1-f;const ecl=isEclipse();
  const flick=p=>1+Math.sin(now*.011+p)*.07+Math.sin(now*.029+p*2.3)*.05+Math.sin(now*.061+p*3.1)*.03;
  const cp=camera.position;
  if(L.outdoor){
    const dusk=Math.pow(1-Math.min(1,Math.abs(elev)*2.4),2);
    cSky.set(0x070b22).lerp(cB.set(0x2f62b0),f);
    cHor.set(0x151b33).lerp(cB.set(0xa8c6e6),f).lerp(cB.set(0xec8d4c),dusk*.75);
    if(ecl){cSky.set(0x120a22);cHor.set(0x3a2244);}
    const U=sky.material.uniforms;U.top.value.copy(cSky);U.hor.value.copy(cHor);
    V1.set(Math.cos(a)*.85,Math.sin(a),.4).normalize();          // sun direction
    V2.copy(V1).negate();V2.y=Math.abs(V2.y)*.9+.08;V2.normalize(); // moon direction (always above horizon at night)
    if(ecl)V2.copy(V1).y=Math.max(V1.y,.35),V2.normalize(),V1.copy(V2);
    const showSun=elev>-.08||ecl;U.sunDir.value.copy(showSun?V1:V2);
    U.sunCol.value.setRGB(1,.72+.25*f,.45+.45*f);if(!showSun)U.sunCol.value.setRGB(.5,.6,.9);
    U.glow.value=ecl?.35:showSun?clamp(elev*3+.45,0,1):.25;
    sky.position.copy(cp);stars.position.copy(cp);
    sunSpr.visible=showSun;sunSpr.position.copy(cp).addScaledVector(V1,50);sunSpr.material.color.setRGB(1,.75+.25*f,.5+.45*f);sunSpr.scale.setScalar(ecl?11:9);
    moonSpr.position.copy(cp).addScaledVector(V2,48);moonSpr.visible=night>.2||ecl;
    if(ecl){moonSpr.material.color.set(0x0a0610);sunSpr.material.color.set(0xd9a0ff);}else moonSpr.material.color.set(0xffffff);
    moonSpr.material.opacity=ecl?1:clamp(night*1.4-.2,0,1);
    cFog.copy(cHor).convertSRGBToLinear();scene.fog.color.copy(cFog);scene.background=cFog;
    hemi.color.copy(cSky).lerp(cB.set(0xffffff),.35);hemi.groundColor.set(0x3a2c1c);hemi.intensity=ecl?.3:.14+.55*f;
    ambient.intensity=.05;
    const mx=L.W/2,mz=L.H/2;sun.position.set(mx+V1.x*34,Math.max(2,V1.y*34),mz+V1.z*34);sun.intensity=ecl?.12:1.9*f;sun.color.setRGB(1,.72+.26*f,.5+.45*f);sun.castShadow=f>.02&&!ecl;
    moonLight.position.set(mx+V2.x*34,V2.y*34,mz+V2.z*34);moonLight.intensity=ecl?.35:.45*night;
    torch.intensity=0;sconceLights.forEach(l=>l.intensity=0);
    MAT.house.emissiveIntensity=ecl?1.2:clamp(1-f*1.7,0,1)*1.4;if(MAT.hv)MAT.hv.forEach(a=>a.forEach(m=>m.emissiveIntensity=MAT.house.emissiveIntensity));
    for(const l of dyn.lamps){const k=(ecl?1:clamp(night*1.3-.15,0,1))*flick(l.phase);l.glow.material.opacity=k*.95;l.pool.material.opacity=k*.45;}
    stars.material.opacity=ecl?.7:clamp(1-f*2.4,0,1);
    const cc=cB.set(0xffffff).lerp(cA.set(0xffb88a),dusk*.8).lerp(cA.set(0x3a4260),night*.85);
    U.uT.value=now*.001;U.cLit.value.copy(cc);U.cDark.value.copy(cc).multiplyScalar(ecl?.5:.62+.1*f);U.cAmt.value=ecl?.45:.55+.4*f;
    MAT.pond.uniforms.sky.value.copy(cHor).lerp(cSky,.4);MAT.river.uniforms.sky.value.copy(MAT.pond.uniforms.sky.value);MAT.river.uniforms.sunCol.value.copy(MAT.pond.uniforms.sunCol.value);
    MAT.mount.color.copy(cFog).multiplyScalar(.62).lerp(cA.set(0x0c1018),.12);
    if(dyn.shrine){const c3=ecl?0xb48cff:isDay()?0xe8c170:0x9db6ff;dyn.shrine.material.color.setHex(c3);dyn.shrineGlow.material.color.setHex(c3);}MAT.pond.uniforms.sunCol.value.setRGB(1,.85,.6).multiplyScalar(ecl?.1:.3+.7*f);
    dust.material.opacity=ecl?.6:night*.9*(.6+.4*Math.sin(now*.004));dust.material.size=.06;
  }else{
    scene.background=cSky.set(L.fog);scene.fog.color.set(L.fog);
    hemi.color.set(ecl?0xa070e0:(isDay()?0xffd9a0:0x8fa8ff));hemi.groundColor.set(0x100c08);hemi.intensity=.12;
    ambient.intensity=.03;sun.intensity=0;moonLight.intensity=0;
    torch.position.copy(cp);torch.position.y=.62;torch.intensity=1.5*flick(0);
    if(ecl)torch.color.set(0xc080ff);else torch.color.setHex(L.torch);
    for(const l of dyn.lamps){const k=flick(l.phase);l.glow.material.opacity=.45*k;l.flame.scale.set(.1*k,.2*(2-k*.9),1);}
    const near=dyn.lamps.map(l=>[l,l.pos.distanceToSquared(cp)]).sort((p,q)=>p[1]-q[1]);
    sconceLights.forEach((s,i)=>{const n=near[i];if(n&&n[1]<30){s.position.copy(n[0].pos);s.color.setHex(n[0].col);s.intensity=1.25*flick(n[0].phase);}else s.intensity=0;});
    MAT.crystal.emissiveIntensity=(isDay()?.35:.8)+(ecl?.6:0);
    dust.material.opacity=.4;dust.material.size=.035;
  }
  // drifting motes around the party
  dust.position.set(cp.x,0,cp.z);const P=dust.geometry.attributes.position,arr=P.array;
  for(let i=0;i<arr.length;i+=3){arr[i]+=Math.sin(now*.0004+i)*.0012;arr[i+1]+=L.outdoor?Math.sin(now*.001+i)*.0015:.0009;arr[i+2]+=Math.cos(now*.0005+i)*.0012;if(arr[i+1]>1.05)arr[i+1]=0;if(arr[i+1]<0)arr[i+1]=1;}
  P.needsUpdate=true;
  for(const g of dyn.gates){const open=g.type==='M'?!isDay():isDay();const to=(open?.12:.75)*(1+Math.sin(now*.004)*.12);g.mesh.material.opacity+=(to-g.mesh.material.opacity)*.08;}
  for(const s of dyn.sprites){if(s.userData.bob){const b=s.userData.base||s.position.y;s.userData.base=b;s.position.y=b+Math.sin(now*.003+s.position.x)*.02;}}
  for(const r of dyn.rings){r.material.opacity=.45+Math.sin(now*.004)*.3;}
  for(const g of dyn.glints){const t=Math.max(0,Math.sin(now*.003+g.position.x*7));g.material.opacity=Math.pow(t,6);}
  if(dyn.water)MAT.water.emissiveIntensity=.4+Math.sin(now*.003)*.15;
  if(dyn.altar)dyn.altar.material.opacity=(S.flags.sun&&S.flags.moon)?1:.35;
  syncRoamers(now);
}
function syncRoamers(now){
  if(!S||!world||!dyn.roam)return;const list=(S.roam&&S.roam[S.lvl])||[];const act=roamActive();const live={};
  list.forEach(r=>{live[r.id]=1;let o=dyn.roam[r.id];
    if(!o){const sc=r.elite?.78:.62;const sp=sprite(monTex(r.g[0]),sc,sc,r.x+.5,sc/2,r.y+.5);if(r.elite)sp.material.color.setHex(0xffa898);const b=blob(r.x+.5,r.y+.5,sc*.4);
      const al=glowSprite(r.elite?0xff5a3a:0xff8a3a,.35,r.x+.5,sc+.08,r.y+.5,0);world.add(sp,b,al);o=dyn.roam[r.id]={sp,b,al,sc};}
    const tx=r.x+.5,tz=r.y+.5,P=o.sp.position;P.x+=(tx-P.x)*.14;P.z+=(tz-P.z)*.14;P.y=o.sc/2+Math.abs(Math.sin(now*.007+r.x*2))*.035;
    o.b.position.x=P.x;o.b.position.z=P.z;o.al.position.set(P.x,o.sc+.1,P.z);o.al.material.opacity=r.alert?.55+Math.sin(now*.012)*.3:0;
    const vis=act&&!(C&&C.roamer===r.id);o.sp.visible=o.b.visible=o.al.visible=vis;});
  for(const id in dyn.roam)if(!live[id]){const o=dyn.roam[id];world.remove(o.sp,o.b,o.al);o.sp.material.dispose();o.al.material.dispose();o.b.material.dispose();o.b.geometry.dispose();delete dyn.roam[id];}
}

export function setYaw(v){yaw=v;}
