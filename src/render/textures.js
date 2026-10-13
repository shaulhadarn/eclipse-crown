// TEXTURES (ported from the single-file build)
import '../audio/audio.js'; // load-order chain: keeps the original top-to-bottom start-up order
import * as THREE from 'three';
import { SRGB, pixTex, radial } from './world.js';

function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function canvas(w,h,draw,seed=7){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h,mulberry(seed));return c;}
export function tex(w,h,draw,seed,rep){const t=new THREE.CanvasTexture(canvas(w,h,draw,seed));if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.anisotropy=4;return t;}
export function speck(g,w,h,r,n,a){for(let i=0;i<n;i++){const v=r()*255|0;g.fillStyle=`rgba(${v},${v},${v},${a})`;g.fillRect(r()*w|0,r()*h|0,2,2);}}
export const TEX={};
export function buildTextures(){
  TEX.stone=tex(128,128,(g,w,h,r)=>{g.fillStyle='#17161a';g.fillRect(0,0,w,h);for(let row=0;row<8;row++){const off=(row%2)*16;for(let x=-32;x<w;x+=32){const s=48+r()*26|0;g.fillStyle=`rgb(${s+8},${s+3},${s})`;g.fillRect(x+off+1,row*16+1,30,14);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+off+1,row*16+12,30,3);}}speck(g,w,h,r,900,.07);g.fillStyle='rgba(40,70,40,.35)';for(let i=0;i<14;i++)g.fillRect(r()*w,r()*h,r()*10+2,r()*4+1);},3);
  TEX.house=tex(128,128,(g,w,h,r)=>{g.fillStyle='#a8977a';g.fillRect(0,0,w,h);speck(g,w,h,r,1400,.06);g.fillStyle='#3d2a1c';g.fillRect(0,0,w,9);g.fillRect(0,h-12,w,12);g.fillRect(0,0,8,h);g.fillRect(w-8,0,8,h);g.save();g.strokeStyle='#3d2a1c';g.lineWidth=7;g.beginPath();g.moveTo(8,h-12);g.lineTo(34,40);g.moveTo(w-8,h-12);g.lineTo(w-34,40);g.stroke();g.restore();g.fillStyle='#241810';g.fillRect(42,34,44,42);g.fillStyle='#4d3a26';g.fillRect(46,38,36,34);g.fillStyle='#3d2a1c';g.fillRect(62,38,4,34);g.fillRect(46,53,36,4);},5);
  TEX.houseGlow=tex(128,128,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);const gr=g.createRadialGradient(64,55,2,64,55,34);gr.addColorStop(0,'#ffcf7a');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(40,32,48,46);g.fillStyle='#000';g.fillRect(62,38,4,34);g.fillRect(46,53,36,4);},5);
  TEX.crystal=tex(128,128,(g,w,h,r)=>{g.fillStyle='#120f22';g.fillRect(0,0,w,h);for(let i=0;i<26;i++){const x=r()*w,y=r()*h,s=12+r()*26;g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*.6,y);g.lineTo(x,y+s);g.lineTo(x-s*.6,y);g.closePath();const v=20+r()*30|0;g.fillStyle=`rgb(${v+10},${v},${v+40})`;g.fill();g.strokeStyle=`rgba(160,140,255,${.2+r()*.3})`;g.lineWidth=1;g.stroke();}},9);
  TEX.crystalGlow=tex(128,128,(g,w,h,r)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.strokeStyle='#6a58c8';for(let i=0;i<10;i++){g.lineWidth=1+r();g.beginPath();g.moveTo(r()*w,r()*h);g.lineTo(r()*w,r()*h);g.stroke();}},11);
  TEX.cobble=tex(128,128,(g,w,h,r)=>{g.fillStyle='#252528';g.fillRect(0,0,w,h);for(let i=0;i<70;i++){const s=50+r()*30|0;g.fillStyle=`rgb(${s},${s-2},${s-4})`;g.beginPath();g.ellipse(r()*w,r()*h,6+r()*7,5+r()*6,r()*3,0,7);g.fill();}speck(g,w,h,r,500,.06);},13,true);
  TEX.flag=tex(128,128,(g,w,h,r)=>{g.fillStyle='#141210';g.fillRect(0,0,w,h);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const s=36+r()*16|0;g.fillStyle=`rgb(${s+6},${s+2},${s-2})`;g.fillRect(x*32+1,y*32+1,30,30);}speck(g,w,h,r,700,.07);},15,true);
  TEX.flag2=tex(128,128,(g,w,h,r)=>{g.fillStyle='#0e0c16';g.fillRect(0,0,w,h);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const s=28+r()*14|0;g.fillStyle=`rgb(${s},${s-2},${s+14})`;g.fillRect(x*32+1,y*32+1,30,30);}g.strokeStyle='rgba(150,130,255,.18)';for(let i=0;i<6;i++){g.beginPath();g.moveTo(r()*w,r()*h);g.lineTo(r()*w,r()*h);g.stroke();}},17,true);
  TEX.ceil=tex(128,128,(g,w,h,r)=>{g.fillStyle='#0f0e10';g.fillRect(0,0,w,h);speck(g,w,h,r,1400,.06);},19,true);
  TEX.ceil2=tex(128,128,(g,w,h,r)=>{g.fillStyle='#0a0814';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle=`rgba(200,190,255,${r()*.5})`;g.fillRect(r()*w,r()*h,1.5,1.5);}},21,true);
  TEX.wood=tex(64,64,(g,w,h,r)=>{g.fillStyle='#4b3020';g.fillRect(0,0,w,h);for(let i=0;i<4;i++){g.fillStyle=`rgb(${80+r()*20|0},${50+r()*12|0},${30})`;g.fillRect(0,i*16+1,w,14);}g.fillStyle='#b98a3c';g.fillRect(0,28,w,6);g.fillRect(28,0,6,h);},23);
  TEX.iron=tex(128,128,(g,w,h,r)=>{g.fillStyle='#262931';g.fillRect(0,0,w,h);speck(g,w,h,r,800,.06);g.fillStyle='#454a55';for(let y=10;y<h;y+=28)for(let x=10;x<w;x+=28){g.beginPath();g.arc(x,y,3,0,7);g.fill();}g.strokeStyle='#c9973f';g.lineWidth=3;g.beginPath();g.arc(44,64,12,0,7);g.stroke();g.strokeStyle='#b8c6e8';g.beginPath();g.arc(84,64,12,0,7);g.stroke();},25);
  TEX.bars=tex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#fff';for(let x=8;x<w;x+=16)g.fillRect(x,0,5,h);g.fillRect(0,4,w,6);g.fillRect(0,60,w,5);g.fillRect(0,h-10,w,6);},27);
}

/* ------- monster & sprite art (drawn procedurally) ------- */
function drawMon(g,t){
  g.lineCap='round';g.lineJoin='round';
  const eye=(x,y,r,c)=>{g.save();g.shadowColor=c;g.shadowBlur=14;g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,7);g.fill();g.restore();};
  const ell=(x,y,rx,ry,c,rot=0)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,7);g.fill();};
  const mirror=f=>{f();g.save();g.translate(256,0);g.scale(-1,1);f();g.restore();};
  const poly=(pts,fill,stroke)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke();}};
  switch(t){
  case'rat':g.strokeStyle='#c98a8a';g.lineWidth=7;g.beginPath();g.moveTo(195,195);g.quadraticCurveTo(252,185,236,112);g.stroke();ell(145,190,74,44,'#4f4852');ell(145,178,62,30,'#6a6370');ell(80,168,38,32,'#6a6370');ell(64,138,15,17,'#8a7f86');ell(96,136,15,17,'#8a7f86');ell(46,176,9,7,'#c98a8a');eye(70,160,5,'#ff3b30');eye(90,160,5,'#ff3b30');g.fillStyle='#eee';g.fillRect(44,182,5,10);g.fillRect(51,182,5,10);ell(110,230,14,6,'#3c363e');ell(178,230,14,6,'#3c363e');break;
  case'skel':g.strokeStyle='#d8cfb8';g.lineWidth=9;g.beginPath();g.moveTo(128,96);g.lineTo(128,180);g.stroke();g.lineWidth=6;for(let i=0;i<4;i++){g.beginPath();g.ellipse(128,108+i*15,34-i*4,10,0,0,Math.PI);g.stroke();}g.beginPath();g.moveTo(96,104);g.lineTo(74,150);g.lineTo(84,186);g.moveTo(160,104);g.lineTo(186,146);g.lineTo(200,120);g.moveTo(112,188);g.lineTo(104,248);g.moveTo(144,188);g.lineTo(152,248);g.stroke();ell(128,186,26,10,'#d8cfb8');g.strokeStyle='#8f97a6';g.lineWidth=7;g.beginPath();g.moveTo(200,124);g.lineTo(226,20);g.stroke();g.lineWidth=5;g.beginPath();g.moveTo(186,112);g.lineTo(214,122);g.stroke();ell(128,60,34,38,'#e6ddc8');g.fillStyle='#e6ddc8';g.fillRect(110,84,36,16);ell(114,58,10,12,'#140f0c');ell(142,58,10,12,'#140f0c');eye(114,60,3.5,'#ff6a3d');eye(142,60,3.5,'#ff6a3d');g.fillStyle='#140f0c';for(let i=0;i<5;i++)g.fillRect(113+i*7,88,3,8);break;
  case'bat':mirror(()=>{g.fillStyle='#2b2233';g.beginPath();g.moveTo(128,118);g.quadraticCurveTo(64,36,6,92);g.quadraticCurveTo(28,108,26,142);g.quadraticCurveTo(48,122,62,152);g.quadraticCurveTo(80,128,100,160);g.lineTo(128,152);g.closePath();g.fill();g.strokeStyle='#4a3b57';g.lineWidth=2;g.beginPath();g.moveTo(120,124);g.lineTo(26,142);g.moveTo(120,130);g.lineTo(62,152);g.stroke();poly([[112,112],[104,78],[124,106]],'#3a2f44');});ell(128,140,26,38,'#3a2f44');eye(117,124,5,'#ffd23f');eye(139,124,5,'#ffd23f');g.fillStyle='#fff';g.beginPath();g.moveTo(120,146);g.lineTo(124,158);g.lineTo(127,146);g.moveTo(130,146);g.lineTo(133,158);g.lineTo(137,146);g.fill();break;
  case'wight':{const gr=g.createLinearGradient(0,30,0,252);gr.addColorStop(0,'rgba(178,196,188,.96)');gr.addColorStop(.7,'rgba(120,140,135,.6)');gr.addColorStop(1,'rgba(90,110,105,0)');g.fillStyle=gr;g.beginPath();g.moveTo(128,24);g.bezierCurveTo(70,30,58,110,50,150);g.lineTo(36,252);g.quadraticCurveTo(70,232,92,252);g.quadraticCurveTo(128,230,160,252);g.quadraticCurveTo(190,232,220,252);g.lineTo(206,150);g.bezierCurveTo(198,110,186,30,128,24);g.fill();ell(128,78,27,33,'#081010');eye(118,76,5,'#7ff5e8');eye(138,76,5,'#7ff5e8');g.strokeStyle='rgba(200,220,210,.8)';g.lineWidth=4;g.beginPath();g.moveTo(70,140);g.lineTo(40,170);g.lineTo(34,160);g.moveTo(40,170);g.lineTo(30,176);g.moveTo(186,140);g.lineTo(216,170);g.lineTo(222,160);g.moveTo(216,170);g.lineTo(226,176);g.stroke();break;}
  case'wolf':g.fillStyle='#2f2c35';[[92,180],[112,186],[168,186],[190,180]].forEach(([x,y])=>g.fillRect(x,y,14,56));ell(146,160,80,40,'#3b3842');g.fillStyle='#3b3842';g.beginPath();g.moveTo(220,150);g.quadraticCurveTo(252,120,246,90);g.quadraticCurveTo(236,130,210,140);g.fill();poly([[92,118],[30,146],[26,164],[82,176],[104,146]],'#46424e');poly([[74,122],[82,90],[96,128]],'#46424e');poly([[92,120],[108,94],[108,132]],'#3b3842');eye(68,136,5,'#ffae2b');g.fillStyle='#fff';g.fillRect(34,160,4,8);g.fillRect(44,162,4,8);break;
  case'golem':poly([[128,70],[188,98],[196,176],[128,210],[60,176],[68,98]],'rgba(150,205,230,.82)','rgba(255,255,255,.7)');poly([[128,70],[188,98],[128,130],[68,98]],'rgba(200,235,250,.7)','rgba(255,255,255,.7)');poly([[128,130],[196,176],[128,210]],'rgba(110,170,205,.8)','rgba(255,255,255,.6)');poly([[60,110],[26,160],[40,200],[70,160]],'rgba(150,205,230,.8)','rgba(255,255,255,.6)');poly([[196,110],[230,160],[216,200],[186,160]],'rgba(150,205,230,.8)','rgba(255,255,255,.6)');poly([[128,20],[154,44],[128,70],[102,44]],'rgba(210,240,255,.9)','#fff');poly([[92,206],[112,250],[76,250]],'rgba(140,195,220,.8)','#fff');poly([[164,206],[180,250],[144,250]],'rgba(140,195,220,.8)','#fff');eye(128,44,6,'#e8faff');break;
  case'moth':mirror(()=>{ell(84,100,64,44,'rgba(216,204,168,.95)',-.5);ell(92,168,42,30,'rgba(196,182,146,.95)',.45);ell(76,98,16,16,'#6d3f7c');ell(76,98,8,8,'#f2e3b3');ell(96,168,9,9,'#6d3f7c');g.strokeStyle='#5c4a3a';g.lineWidth=3;g.beginPath();g.moveTo(122,70);g.quadraticCurveTo(108,30,88,24);g.stroke();});ell(128,136,14,52,'#5c4a3a');eye(122,90,4,'#fff6c8');eye(134,90,4,'#fff6c8');break;
  case'uknight':g.fillStyle='#1c1b26';g.beginPath();g.moveTo(84,100);g.lineTo(172,100);g.lineTo(160,200);g.lineTo(96,200);g.closePath();g.fill();g.strokeStyle='#6c6a80';g.lineWidth=3;g.stroke();ell(78,108,30,20,'#2a2938');ell(178,108,30,20,'#2a2938');g.fillStyle='#16151e';g.fillRect(98,198,24,52);g.fillRect(134,198,24,52);g.fillStyle='#2a2938';g.beginPath();g.moveTo(98,48);g.quadraticCurveTo(128,12,158,48);g.lineTo(154,96);g.lineTo(102,96);g.closePath();g.fill();g.strokeStyle='#6c6a80';g.stroke();eye(128,62,1,'#b57bff');g.save();g.shadowColor='#b57bff';g.shadowBlur=16;g.fillStyle='#c79bff';g.fillRect(106,58,44,6);g.restore();g.strokeStyle='#9aa0b8';g.lineWidth=9;g.beginPath();g.moveTo(208,190);g.lineTo(236,24);g.stroke();g.lineWidth=6;g.beginPath();g.moveTo(190,176);g.lineTo(226,184);g.stroke();break;
  case'eater':{const gr=g.createRadialGradient(128,128,10,128,128,108);gr.addColorStop(0,'#000');gr.addColorStop(.7,'#140a24');gr.addColorStop(1,'rgba(110,50,170,.1)');g.fillStyle=gr;g.beginPath();g.arc(128,128,108,0,7);g.fill();g.strokeStyle='rgba(170,110,240,.8)';g.lineWidth=3;g.beginPath();g.arc(128,128,96,0,7);g.stroke();for(let i=0;i<30;i++){g.fillStyle=`rgba(255,255,255,${Math.random()})`;g.fillRect(50+Math.random()*156,50+Math.random()*156,2,2);}g.fillStyle='#050208';g.beginPath();g.ellipse(128,160,50,24,0,0,Math.PI);g.fill();g.fillStyle='#f2eefc';for(let i=0;i<7;i++){g.beginPath();g.moveTo(84+i*13,160);g.lineTo(90+i*13,176);g.lineTo(96+i*13,160);g.fill();}eye(128,100,12,'#ffffff');break;}
  case'regent':g.lineWidth=12;g.save();g.shadowBlur=22;g.shadowColor='#e8c170';g.strokeStyle='#e8c170';g.beginPath();g.arc(128,76,62,Math.PI*.5,Math.PI*1.5);g.stroke();g.shadowColor='#b8c6e8';g.strokeStyle='#c7d4f2';g.beginPath();g.arc(128,76,62,-Math.PI*.5,Math.PI*.5);g.stroke();g.restore();g.fillStyle='#0d0a16';g.beginPath();g.moveTo(128,40);g.bezierCurveTo(60,70,52,160,30,256);g.lineTo(226,256);g.bezierCurveTo(204,160,196,70,128,40);g.fill();g.strokeStyle='#5b4690';g.lineWidth=3;g.stroke();ell(128,78,26,30,'#05040a');poly([[100,54],[106,26],[116,46],[128,18],[140,46],[150,26],[156,54]],'#c9973f','#e8c170');eye(118,78,4,'#fff');eye(138,78,4,'#fff');g.strokeStyle='#2c2442';g.lineWidth=8;g.beginPath();g.moveTo(74,150);g.lineTo(40,190);g.moveTo(182,150);g.lineTo(216,190);g.stroke();eye(40,192,7,'#e8c170');eye(216,192,7,'#c7d4f2');break;
  case'boar':g.fillStyle='#2e231c';[[84,186],[108,192],[164,192],[186,186]].forEach(([x,y])=>g.fillRect(x,y,14,50));ell(140,160,86,50,'#4a3a2c');ell(140,150,76,36,'#5a4634');
    g.fillStyle='#2a1e16';for(let i=0;i<9;i++){const x=90+i*12;g.beginPath();g.moveTo(x,118-Math.sin(i/8*Math.PI)*8);g.lineTo(x+6,92-Math.sin(i/8*Math.PI)*14);g.lineTo(x+12,118-Math.sin(i/8*Math.PI)*8);g.fill();}
    poly([[80,124],[26,146],[20,176],[70,190],[98,160]],'#5a4634');ell(24,162,12,14,'#7a5a48');eye(64,146,5,'#ff5a2a');
    g.strokeStyle='#f2ead8';g.lineWidth=6;g.beginPath();g.moveTo(38,176);g.quadraticCurveTo(26,160,34,142);g.moveTo(52,180);g.quadraticCurveTo(44,164,52,148);g.stroke();break;
  case'wisp':{const gr=g.createRadialGradient(128,120,6,128,120,90);gr.addColorStop(0,'rgba(230,255,220,1)');gr.addColorStop(.3,'rgba(120,230,170,.9)');gr.addColorStop(1,'rgba(40,120,90,0)');g.fillStyle=gr;g.beginPath();g.arc(128,120,90,0,7);g.fill();
    g.strokeStyle='#3a5a2a';g.lineWidth=5;for(let i=0;i<7;i++){const a=i/7*Math.PI*2;g.beginPath();g.moveTo(128+Math.cos(a)*30,120+Math.sin(a)*30);g.quadraticCurveTo(128+Math.cos(a+.5)*70,120+Math.sin(a+.5)*70,128+Math.cos(a)*100,120+Math.sin(a)*100);g.stroke();
      g.fillStyle='#5a7a3a';g.beginPath();g.arc(128+Math.cos(a)*100,120+Math.sin(a)*100,5,0,7);g.fill();}
    ell(112,112,8,11,'#0a2a1a');ell(144,112,8,11,'#0a2a1a');eye(112,112,3,'#eaffd8');eye(144,112,3,'#eaffd8');g.fillStyle='#0a2a1a';g.beginPath();g.ellipse(128,138,12,6,0,0,Math.PI);g.fill();break;}
  case'thief':case'bandit':{const bd=t==='thief';g.fillStyle=bd?'#2a2630':'#5a3e26';g.beginPath();g.moveTo(128,50);g.bezierCurveTo(70,60,66,150,58,248);g.lineTo(198,248);g.bezierCurveTo(190,150,186,60,128,50);g.fill();
    ell(128,92,30,34,bd?'#1c1a22':'#4a3220');ell(128,98,22,24,'#0e0c10');eye(118,94,3.5,'#ffd23f');eye(138,94,3.5,'#ffd23f');if(!bd){g.fillStyle='#9a2a20';g.fillRect(104,104,48,14);}
    g.strokeStyle=bd?'#cfd6e2':'#8a6a4a';g.lineWidth=bd?5:7;g.beginPath();g.moveTo(186,170);g.lineTo(bd?222:230,bd?120:96);g.stroke();if(!bd){g.fillStyle='#b8c0cc';g.beginPath();g.moveTo(222,86);g.quadraticCurveTo(250,100,236,124);g.lineTo(226,104);g.fill();}
    g.strokeStyle=bd?'#3a3440':'#6a4a2e';g.lineWidth=9;g.beginPath();g.moveTo(80,150);g.lineTo(60,190);g.moveTo(176,150);g.lineTo(186,172);g.stroke();break;}
  case'ghoul':g.fillStyle='#5a6a52';g.beginPath();g.moveTo(96,110);g.bezierCurveTo(80,160,90,210,104,250);g.lineTo(160,250);g.bezierCurveTo(178,200,184,150,168,108);g.closePath();g.fill();
    g.strokeStyle='#5a6a52';g.lineWidth=12;g.beginPath();g.moveTo(100,130);g.quadraticCurveTo(50,170,42,226);g.moveTo(166,130);g.quadraticCurveTo(214,170,222,226);g.stroke();g.strokeStyle='#d8d0b0';g.lineWidth=3;[36,44,52].forEach(x=>{g.beginPath();g.moveTo(x+4,226);g.lineTo(x,244);g.stroke();g.beginPath();g.moveTo(x+176,226);g.lineTo(x+180,244);g.stroke();});
    ell(130,92,32,30,'#6a7a60');eye(118,88,5,'#9aff6a');eye(142,88,5,'#9aff6a');g.fillStyle='#1a1a12';g.beginPath();g.ellipse(130,108,14,8,0,0,Math.PI);g.fill();g.fillStyle='#e8e0c8';for(let i=0;i<5;i++)g.fillRect(120+i*5,106,2.5,6);break;
  case'spider':g.strokeStyle='#2a1e2a';g.lineWidth=6;for(let i=0;i<4;i++){[-1,1].forEach(sd=>{g.beginPath();g.moveTo(128,150);g.quadraticCurveTo(128+sd*(60+i*14),96+i*22,128+sd*(96+i*8),170+i*18);g.stroke();});}
    ell(128,176,52,46,'#2a1e2e');ell(128,176,40,34,'#3a2a40');g.fillStyle='#c0282a';g.beginPath();g.moveTo(120,160);g.lineTo(136,160);g.lineTo(128,176);g.lineTo(136,192);g.lineTo(120,192);g.lineTo(128,176);g.fill();
    ell(128,132,26,22,'#2a1e2e');[[118,126],[138,126],[112,134],[144,134],[124,120],[132,120]].forEach(([x,y])=>eye(x,y,3,'#ff3a3a'));break;
  case'shade':{const gr=g.createLinearGradient(80,40,180,250);gr.addColorStop(0,'rgba(220,225,255,.95)');gr.addColorStop(.5,'rgba(130,120,200,.85)');gr.addColorStop(1,'rgba(60,50,110,0)');g.fillStyle=gr;
    g.beginPath();g.moveTo(128,34);g.bezierCurveTo(96,36,92,80,104,100);g.lineTo(70,130);g.lineTo(84,250);g.lineTo(172,250);g.lineTo(186,130);g.lineTo(152,100);g.bezierCurveTo(164,80,160,36,128,34);g.fill();
    g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=1.5;[[120,60,140,120],[140,120,118,170],[118,170,146,230],[100,140,120,170]].forEach(([a,b,c2,d])=>{g.beginPath();g.moveTo(a,b);g.lineTo(c2,d);g.stroke();});eye(118,68,4,'#ffffff');eye(138,68,4,'#ffffff');break;}
  case'sentinel':g.fillStyle='#2a3450';g.fillRect(84,96,88,120);g.strokeStyle='#e8c170';g.lineWidth=4;g.strokeRect(84,96,88,120);g.fillStyle='#1c2438';g.fillRect(92,214,28,38);g.fillRect(136,214,28,38);
    g.fillStyle='#3a4666';[[52,100],[172,100]].forEach(([x,y])=>{g.fillRect(x,y,32,90);});poly([[128,120],[138,146],[164,148],[144,164],[152,190],[128,176],[104,190],[112,164],[92,148],[118,146]],'#e8c170');
    eye(128,70,20,'#9ad0ff');ell(128,70,12,12,'#eaf6ff');break;
  case'bear':ell(128,172,96,72,'#4a3624');ell(128,160,84,56,'#5a4230');[[70,140,22,14],[170,190,26,16],[110,120,18,10]].forEach(([x,y,a,b])=>ell(x,y,a,b,'#4a6a2c'));
    ell(128,96,44,40,'#5a4230');ell(96,64,14,14,'#4a3624');ell(160,64,14,14,'#4a3624');ell(128,112,20,14,'#7a5a40');ell(128,104,8,6,'#1a120a');eye(112,90,4,'#ffae2b');eye(144,90,4,'#ffae2b');
    g.strokeStyle='#e8e0cc';g.lineWidth=3;[[52,232],[72,238],[184,238],[204,232]].forEach(([x,y])=>{g.beginPath();g.moveTo(x,y-10);g.lineTo(x-3,y);g.stroke();});break;
  case'barkling':g.fillStyle='#5a4028';g.beginPath();g.moveTo(104,110);g.lineTo(152,110);g.lineTo(164,250);g.lineTo(92,250);g.closePath();g.fill();g.strokeStyle='#3a2816';g.lineWidth=2;for(let i=0;i<6;i++){g.beginPath();g.moveTo(106+i*9,120);g.lineTo(100+i*11,246);g.stroke();}
    g.strokeStyle='#5a4028';g.lineWidth=8;g.beginPath();g.moveTo(106,140);g.lineTo(60,110);g.lineTo(46,80);g.moveTo(150,140);g.lineTo(196,112);g.lineTo(214,84);g.stroke();
    [[128,80,54,40],[96,96,30,24],[160,96,30,24],[128,56,34,26]].forEach(([x,y,a,b],i)=>ell(x,y,a,b,['#3a6a2a','#4a7a32','#2e5a22','#5a8a3a'][i]));eye(116,150,5,'#ffb347');eye(140,150,5,'#ffb347');break;
  case'npc':g.fillStyle='#4a3b2c';g.beginPath();g.moveTo(128,40);g.bezierCurveTo(84,50,80,120,70,250);g.lineTo(186,250);g.bezierCurveTo(176,120,172,50,128,40);g.fill();ell(128,84,24,28,'#140f0a');eye(120,84,2.5,'#e7d7b0');eye(136,84,2.5,'#e7d7b0');g.strokeStyle='#2a2018';g.lineWidth=4;g.beginPath();g.moveTo(176,150);g.lineTo(200,170);g.stroke();eye(204,190,12,'#ffb347');g.fillStyle='#3b2e20';g.fillRect(196,176,16,4);break;
  }
}
const SPRITE_TEX={};const MONIMG={};
export function monImg(t){if(!MONIMG[t]){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.fillStyle='#1a1420';g.fillRect(0,0,96,96);g.drawImage(monTex(t).image,0,0,96,96);MONIMG[t]=c.toDataURL();}return MONIMG[t];}
export const COOL_MON=/moth|golem|uknight|eater|shade|sentinel|regent|wisp/;
function monCanvas(t){const K=2,W=256*K;
  const base=canvas(W,W,g=>{g.scale(K,K);drawMon(g,t);});
  const sil=canvas(W,W,g=>{g.drawImage(base,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#08070b';g.fillRect(0,0,W,W);});
  return canvas(W,W,g=>{
    [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,2],[-2,2],[2,-2]].forEach(([dx,dy])=>g.drawImage(sil,dx,dy));
    g.drawImage(base,0,0);
    g.globalCompositeOperation='source-atop';
    let gr=g.createLinearGradient(0,0,W*.4,W);gr.addColorStop(0,'rgba(255,238,205,.2)');gr.addColorStop(.5,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=gr;g.fillRect(0,0,W,W);
    gr=g.createLinearGradient(0,W*.72,0,W);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.4)');g.fillStyle=gr;g.fillRect(0,0,W,W);
    const r=mulberry(t.length*131);for(let i=0;i<6000;i++){const v=r()*255|0;g.fillStyle=`rgba(${v},${v},${v},.045)`;g.fillRect(r()*W,r()*W,2,2);}
    const rim=canvas(W,W,h=>{h.drawImage(sil,0,0);h.globalCompositeOperation='source-in';h.fillStyle=COOL_MON.test(t)?'#b8ccff':'#ffd49a';h.fillRect(0,0,W,W);h.globalCompositeOperation='destination-out';h.drawImage(sil,6,6);});
    g.globalCompositeOperation='lighter';g.globalAlpha=.42;g.drawImage(rim,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
  });}
export function monTex(t){if(!SPRITE_TEX[t]){const tx=SRGB(new THREE.CanvasTexture(monCanvas(t)));tx.anisotropy=4;tx.premultiplyAlpha=true;SPRITE_TEX[t]=tx;}return SPRITE_TEX[t];}
export function labelTex(label,glyph,color){const k='L'+label;if(SPRITE_TEX[k])return SPRITE_TEX[k];const t=new THREE.CanvasTexture(canvas(256,128,g=>{g.fillStyle='#2a1c12';g.fillRect(8,14,240,100);g.strokeStyle=color;g.lineWidth=4;g.strokeRect(12,18,232,92);g.fillStyle=color;g.font='44px "IM Fell English SC", Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText(glyph+' '+label,128,66);g.fillStyle='#1a120c';g.fillRect(60,0,6,16);g.fillRect(190,0,6,16);}));t.premultiplyAlpha=true;SPRITE_TEX[k]=SRGB(t);return t;}
export function orbTex(c1,c2){const k='O'+c1;if(SPRITE_TEX[k])return SPRITE_TEX[k];const c=new THREE.Color(c1);const R=c.r*255,G=c.g*255,B=c.b*255;
  const t=pixTex(128,128,(u,v)=>{const d=radial(u,v);const w=d<.3?1-d/.3:0;const a=d<.94?(d<.3?1:Math.pow(1-(d-.3)/.64,1.4)):0;return[R+(255-R)*w,G+(255-G)*w,B+(255-B)*w,a*255];});SPRITE_TEX[k]=SRGB(t);return t;}

export function portrait(cls,blink){const K=2.5;return canvas(256*K,256*K,(g,w,h,r)=>{g.scale(K,K);g.imageSmoothingQuality='high';drawPortrait(g,cls,r,blink);},cls.length*97).toDataURL('image/jpeg',.92);}
function drawPortrait(g,cls,r,blink){
  const rg=(x,y,r0,r1,st)=>{const q=g.createRadialGradient(x,y,r0,x,y,r1);st.forEach(([o,c])=>q.addColorStop(o,c));return q;};
  const lg=(x0,y0,x1,y1,st)=>{const q=g.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,c])=>q.addColorStop(o,c));return q;};
  const glow=(x,y,rad,c)=>{g.fillStyle=rg(x,y,0,rad,[[0,c],[1,'rgba(0,0,0,0)']]);g.fillRect(x-rad,y-rad,rad*2,rad*2);};
  const E=(x,y,rx,ry,rot,fill)=>{g.fillStyle=fill;g.beginPath();g.ellipse(x,y,rx,ry,rot,0,7);g.fill();};
  const cx=128,cy=112,fw=74,fh=96;
  const BG={knight:['#7a3020','#160807'],ranger:['#3a5a2c','#0a130a'],cleric:['#9a7024','#1c1306'],sorc:['#28407a','#060a1a']}[cls];
  g.fillStyle=rg(cx,96,8,210,[[0,BG[0]],[1,BG[1]]]);g.fillRect(0,0,256,256);
  // ---------- class backdrops ----------
  if(cls==='knight'){for(let i=0;i<70;i++){const x=r()*256,y=r()*256,s=r()*2+.5;g.fillStyle=`rgba(255,${120+r()*100|0},40,${r()*.8})`;g.fillRect(x,y,s,s*2.2);}glow(cx,90,120,'rgba(255,140,60,.35)');}
  if(cls==='ranger'){for(let i=0;i<24;i++)glow(r()*256,r()*200,10+r()*26,`rgba(210,240,140,${.08+r()*.14})`);
    g.fillStyle='rgba(10,24,10,.7)';for(let s=0;s<2;s++){const bx=s?232:24;for(let i=0;i<7;i++){g.save();g.translate(bx,256);g.rotate((s?-1:1)*(.2+i*.16));g.beginPath();g.ellipse(0,-70,9,70,0,0,7);g.fill();g.restore();}}}
  if(cls==='cleric'){g.save();g.translate(cx,cy-18);for(let i=0;i<24;i++){g.rotate(Math.PI/12);g.fillStyle=i%2?'rgba(255,225,140,.16)':'rgba(255,200,90,.08)';g.beginPath();g.moveTo(0,0);g.lineTo(-14,-190);g.lineTo(14,-190);g.closePath();g.fill();}g.restore();glow(cx,cy-18,110,'rgba(255,230,150,.55)');
    g.strokeStyle='rgba(255,220,130,.85)';g.lineWidth=4;g.save();g.shadowColor='#ffd27a';g.shadowBlur=18;g.beginPath();g.arc(cx,cy-24,72,0,7);g.stroke();g.restore();}
  if(cls==='sorc'){for(let i=0;i<90;i++){const s=r()*1.8+.3;g.fillStyle=`rgba(220,230,255,${r()})`;g.fillRect(r()*256,r()*256,s,s);}
    glow(206,52,60,'rgba(170,200,255,.35)');E(206,52,26,26,0,'#e4ecff');E(218,44,24,24,0,BG[0]);glow(cx,100,100,'rgba(110,150,255,.25)');}
  // ---------- behind-body props ----------
  if(cls==='ranger'){g.strokeStyle='#6e4a28';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(22,90);g.quadraticCurveTo(-4,190,46,256);g.stroke();g.strokeStyle='rgba(230,220,190,.6)';g.lineWidth=1;g.beginPath();g.moveTo(22,90);g.lineTo(46,256);g.stroke();
    [[196,150,'#e8e2d0'],[208,142,'#b8402e'],[220,152,'#e8e2d0']].forEach(([x,y,c])=>{g.save();g.translate(x,y);g.rotate(.35);E(0,0,5,18,0,c);g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=1;g.beginPath();g.moveTo(0,-18);g.lineTo(0,20);g.stroke();g.restore();});}
  if(cls==='sorc'){ // long silver hair behind the face
    g.fillStyle=lg(0,70,0,256,[[0,'#eef2fb'],[1,'#8e9ab8']]);g.beginPath();g.moveTo(cx-44,86);g.bezierCurveTo(cx-70,150,cx-78,210,cx-60,256);g.lineTo(cx+60,256);g.bezierCurveTo(cx+78,210,cx+70,150,cx+44,86);g.closePath();g.fill();
    g.strokeStyle='rgba(120,130,160,.45)';g.lineWidth=1;for(let i=0;i<22;i++){const x=cx-60+i*5.5;g.beginPath();g.moveTo(x,110);g.quadraticCurveTo(x+(r()-.5)*20,190,x+(r()-.5)*14,256);g.stroke();}}
  if(cls==='ranger'||cls==='sorc'){ // hood back
    g.fillStyle=cls==='ranger'?lg(0,40,0,256,[[0,'#3f5f30'],[1,'#1c2c16']]):lg(0,40,0,256,[[0,'#2a3f78'],[1,'#0e1630']]);
    g.beginPath();g.moveTo(cx,30);g.bezierCurveTo(cx+80,30,cx+84,120,cx+78,180);g.lineTo(cx-78,180);g.bezierCurveTo(cx-84,120,cx-80,30,cx,30);g.fill();}
  // ---------- body ----------
  const shoulders=()=>{g.beginPath();g.moveTo(8,256);g.bezierCurveTo(14,210,50,190,cx-30,184);g.lineTo(cx+30,184);g.bezierCurveTo(206,190,242,210,248,256);g.closePath();};
  if(cls==='knight'){
    shoulders();g.fillStyle=lg(0,180,0,256,[[0,'#5f6572'],[1,'#23262e']]);g.fill();
    g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=1;for(let y=192;y<256;y+=5){g.beginPath();g.moveTo(30,y);g.lineTo(226,y);g.stroke();}
    g.fillStyle=lg(0,200,0,256,[[0,'#9a2a20'],[1,'#5a140f']]);g.beginPath();g.moveTo(cx-36,196);g.lineTo(cx+36,196);g.lineTo(cx+44,256);g.lineTo(cx-44,256);g.closePath();g.fill();
    g.strokeStyle='#c9973f';g.lineWidth=3;g.stroke();g.strokeStyle='#e8c170';g.lineWidth=2.5;g.beginPath();g.arc(cx,230,12,0,7);g.stroke();for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.beginPath();g.moveTo(cx+Math.cos(a)*15,230+Math.sin(a)*15);g.lineTo(cx+Math.cos(a)*20,230+Math.sin(a)*20);g.stroke();}
    [-1,1].forEach(sd=>{const px=cx+sd*72;g.fillStyle=lg(px-40,0,px+40,0,sd<0?[[0,'#2a2e38'],[.45,'#d4d9e2'],[.7,'#8a909c'],[1,'#3a3f4b']]:[[0,'#3a3f4b'],[.3,'#9aa0ac'],[.55,'#d4d9e2'],[1,'#2a2e38']]);
      g.beginPath();g.moveTo(px-sd*30,190);g.bezierCurveTo(px-sd*10,176,px+sd*40,180,px+sd*52,212);g.lineTo(px+sd*50,236);g.bezierCurveTo(px+sd*20,222,px-sd*14,214,px-sd*34,218);g.closePath();g.fill();
      g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1.5;g.beginPath();g.moveTo(px-sd*28,204);g.bezierCurveTo(px,196,px+sd*30,200,px+sd*48,222);g.stroke();
      g.fillStyle='#e8c170';[0,1,2].forEach(k=>{g.beginPath();g.arc(px-sd*16+sd*k*20,200+k*4,2,0,7);g.fill();});});
    g.fillStyle=lg(cx-34,0,cx+34,0,[[0,'#3a3f4b'],[.4,'#c4c9d2'],[1,'#3a3f4b']]);g.beginPath();g.moveTo(cx-36,172);g.quadraticCurveTo(cx,186,cx+36,172);g.lineTo(cx+40,192);g.quadraticCurveTo(cx,206,cx-40,192);g.closePath();g.fill();
  }
  if(cls==='ranger'){
    shoulders();g.fillStyle=lg(0,180,0,256,[[0,'#3f5f30'],[1,'#1a2a14']]);g.fill();
    g.fillStyle=lg(0,196,0,256,[[0,'#6a4a2c'],[1,'#3a2616']]);g.beginPath();g.moveTo(cx-34,194);g.lineTo(cx+34,194);g.lineTo(cx+40,256);g.lineTo(cx-40,256);g.closePath();g.fill();
    g.strokeStyle='#2a1a0e';g.lineWidth=7;g.beginPath();g.moveTo(cx+56,190);g.lineTo(cx-40,256);g.stroke();g.strokeStyle='#8a6a3a';g.lineWidth=2;g.stroke();
    g.fillStyle='#c9973f';g.save();g.translate(cx,190);g.rotate(-.5);E(0,0,9,5,0,'#5c8a3a');E(8,4,7,4,.6,'#6fa843');g.restore();E(cx,190,3,3,0,'#e8c170');
  }
  if(cls==='cleric'){
    shoulders();g.fillStyle=lg(0,180,0,256,[[0,'#efe7d6'],[1,'#b8ab90']]);g.fill();
    g.strokeStyle='rgba(120,100,70,.25)';g.lineWidth=1.2;for(let i=0;i<9;i++){g.beginPath();g.moveTo(40+i*22,196);g.quadraticCurveTo(44+i*22,226,36+i*22,256);g.stroke();}
    [-1,1].forEach(sd=>{g.fillStyle=lg(0,190,0,256,[[0,'#e8c170'],[1,'#a8782a']]);g.beginPath();g.moveTo(cx+sd*14,186);g.lineTo(cx+sd*34,186);g.lineTo(cx+sd*40,256);g.lineTo(cx+sd*18,256);g.closePath();g.fill();
      g.fillStyle='#fff3cf';for(let y=200;y<256;y+=18){g.fillRect(cx+sd*27-1,y,2,9);g.fillRect(cx+sd*27-4,y+3,8,2);}});
    glow(cx,214,30,'rgba(255,220,120,.7)');g.fillStyle='#e8c170';g.beginPath();g.arc(cx,214,9,0,7);g.fill();g.strokeStyle='#fff0c0';g.lineWidth=1.5;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g.beginPath();g.moveTo(cx+Math.cos(a)*11,214+Math.sin(a)*11);g.lineTo(cx+Math.cos(a)*16,214+Math.sin(a)*16);g.stroke();}
  }
  if(cls==='sorc'){
    shoulders();g.fillStyle=lg(0,180,0,256,[[0,'#243a72'],[1,'#0c1430']]);g.fill();
    g.strokeStyle='#b8c6e8';g.lineWidth=1.5;g.beginPath();g.moveTo(cx-26,190);g.quadraticCurveTo(cx,240,cx+26,190);g.stroke();
    g.strokeStyle='rgba(184,198,232,.6)';g.setLineDash([2,4]);g.beginPath();g.moveTo(cx-32,192);g.quadraticCurveTo(cx,252,cx+32,192);g.stroke();g.setLineDash([]);
    g.save();g.shadowColor='#a8c4ff';g.shadowBlur=14;E(cx,222,8,8,0,'#e4ecff');g.restore();E(cx+4,219,7,7,0,'#243a72');
  }
  // ---------- neck + face ----------
  const skin={knight:['#e8b894','#b97f5a','#7c4a30'],ranger:['#c99670','#9a6644','#5e3a22'],cleric:['#ecc4a4','#c09070','#7e5638'],sorc:['#f2dccf','#d0ada0','#8a6a64']}[cls];
  g.fillStyle=lg(0,cy+30,0,cy+80,[[0,skin[2]],[1,skin[1]]]);g.beginPath();g.moveTo(cx-14,cy+28);g.lineTo(cx+14,cy+28);g.bezierCurveTo(cx+15,cy+56,cx+22,cy+68,cx+34,cy+76);g.lineTo(cx-34,cy+76);g.bezierCurveTo(cx-22,cy+68,cx-15,cy+56,cx-14,cy+28);g.fill();
  g.fillStyle='rgba(40,15,5,.35)';g.beginPath();g.ellipse(cx,cy+46,15,8,0,0,7);g.fill();
  const head=()=>{g.beginPath();g.moveTo(cx,cy-fh*.55);g.bezierCurveTo(cx+fw*.62,cy-fh*.55,cx+fw*.56,cy+fh*.05,cx+fw*.5,cy+fh*.18);g.bezierCurveTo(cx+fw*.42,cy+fh*.38,cx+fw*.2,cy+fh*.49,cx,cy+fh*.5);g.bezierCurveTo(cx-fw*.2,cy+fh*.49,cx-fw*.42,cy+fh*.38,cx-fw*.5,cy+fh*.18);g.bezierCurveTo(cx-fw*.56,cy+fh*.05,cx-fw*.62,cy-fh*.55,cx,cy-fh*.55);g.closePath();};
  [-1,1].forEach(sd=>E(cx+sd*fw*.5,cy+fh*.03,fw*.08,fh*.1,sd*.2,skin[1]));
  head();g.fillStyle=rg(cx-fw*.14,cy-fh*.12,4,fw*.78,[[0,skin[0]],[.62,skin[1]],[1,skin[2]]]);g.fill();
  g.save();head();g.clip();
  g.fillStyle=lg(cx-fw*.5,0,cx+fw*.5,0,[[0,'rgba(0,0,0,0)'],[.55,'rgba(0,0,0,0)'],[1,'rgba(40,14,4,.4)']]);g.fillRect(0,0,256,256);
  glow(cx-fw*.26,cy+fh*.15,fw*.17,'rgba(220,90,80,.22)');glow(cx+fw*.26,cy+fh*.15,fw*.17,'rgba(200,80,70,.14)');
  [-1,1].forEach(sd=>E(cx+sd*fw*.2,cy-fh*.03,fw*.17,fh*.06,0,'rgba(60,24,10,.16)'));
  if(cls==='cleric'){g.strokeStyle='rgba(110,70,45,.4)';g.lineWidth=1.2;[-.3,-.36,-.42].forEach(y=>{g.beginPath();g.moveTo(cx-fw*.26,cy+fh*y);g.quadraticCurveTo(cx,cy+fh*(y-.03),cx+fw*.26,cy+fh*y);g.stroke();});
    [-1,1].forEach(sd=>{for(let k=0;k<2;k++){g.beginPath();g.moveTo(cx+sd*fw*.32,cy+k*4);g.lineTo(cx+sd*fw*.4,cy-3+k*6);g.stroke();}});}
  if(cls==='knight'){g.strokeStyle='rgba(240,200,190,.7)';g.lineWidth=1.6;g.beginPath();g.moveTo(cx+fw*.12,cy-fh*.1);g.lineTo(cx+fw*.3,cy+fh*.2);g.stroke();g.strokeStyle='rgba(120,40,30,.35)';g.lineWidth=.8;g.stroke();}
  if(cls==='ranger'){g.strokeStyle='rgba(30,60,26,.75)';g.lineWidth=3;g.lineCap='round';[0,7].forEach(o=>{g.beginPath();g.moveTo(cx+fw*.12+o*.3,cy+fh*.08+o);g.lineTo(cx+fw*.36,cy+fh*.06+o);g.stroke();});}
  g.restore();
  // eyes
  const iris={knight:'#5a7aa0',ranger:'#6e8a3a',cleric:'#6a4a2a',sorc:'#9ad0ff'}[cls];
  const browC={knight:'#3a2416',ranger:'#6a3218',cleric:'#e8e4dc',sorc:'#dfe6f4'}[cls];
  const eh=cls==='cleric'?fh*.028:fh*.036;
  [-1,1].forEach(sd=>{const ex=cx+sd*fw*.2,ey=cy-fh*.02;
    if(blink){E(ex,ey,fw*.1,eh*1.3,0,skin[1]);E(ex,ey-eh*.25,fw*.1,eh*1.05,0,skin[0]);
      g.strokeStyle='#241208';g.lineWidth=2;g.beginPath();g.ellipse(ex,ey-eh*.1,fw*.095,eh*.9,0,Math.PI*.08,Math.PI*.92);g.stroke();}
    else{
    E(ex,ey,fw*.088,eh,0,'#f4efe6');g.save();g.beginPath();g.ellipse(ex,ey,fw*.088,eh,0,0,7);g.clip();
    if(cls==='sorc'){g.shadowColor='#8ac0ff';g.shadowBlur=12;}
    E(ex+sd*.6,ey+.5,fh*.04,fh*.04,0,iris);g.shadowBlur=0;E(ex+sd*.6,ey+.5,fh*.018,fh*.018,0,cls==='sorc'?'#1a3a6a':'#120a06');
    g.fillStyle='rgba(0,0,0,.28)';g.fillRect(ex-fw*.1,ey-eh,fw*.2,eh*.55);g.restore();
    E(ex-fw*.025,ey-eh*.35,1.5,1.5,0,'#fff');
    g.strokeStyle='#241208';g.lineWidth=2;g.beginPath();g.ellipse(ex,ey+1,fw*.095,eh*1.15,0,Math.PI*1.06,Math.PI*1.94);g.stroke();}
    if(cls==='sorc'||cls==='ranger'){g.lineWidth=1.2;g.beginPath();g.moveTo(ex+sd*fw*.085,ey-eh*.6);g.lineTo(ex+sd*fw*.12,ey-eh*1.2);g.stroke();}
    g.strokeStyle=browC;g.lineCap='round';g.lineWidth=cls==='cleric'?5:cls==='knight'?4:3;
    g.beginPath();g.moveTo(ex-sd*fw*.1,ey-fh*.07+(cls==='knight'?2:0));g.quadraticCurveTo(ex,ey-fh*.11,ex+sd*fw*.12,ey-fh*.075);g.stroke();});
  // nose, mouth
  g.strokeStyle='rgba(90,40,20,.45)';g.lineWidth=2;g.beginPath();g.moveTo(cx+fw*.03,cy+fh*.02);g.quadraticCurveTo(cx+fw*.08,cy+fh*.15,cx+fw*.02,cy+fh*.19);g.stroke();
  [-1,1].forEach(sd=>E(cx+sd*fw*.05,cy+fh*.19,2.2,1.4,0,'rgba(70,30,15,.45)'));glow(cx-fw*.02,cy+fh*.08,6,'rgba(255,255,255,.18)');
  const lip={knight:'#9a5a48',ranger:'#8a4a38',cleric:'#a0685a',sorc:'#b87888'}[cls];
  g.strokeStyle='rgba(60,20,12,.7)';g.lineWidth=1.8;g.beginPath();g.moveTo(cx-fw*.13,cy+fh*.3);g.quadraticCurveTo(cx,cy+fh*(cls==='cleric'?.32:.29),cx+fw*.13,cy+fh*.3);g.stroke();
  E(cx,cy+fh*.325,fw*.095,fh*.022,0,lip);E(cx-2,cy+fh*.318,fw*.03,fh*.007,0,'rgba(255,255,255,.3)');
  // ---------- hair & headwear ----------
  if(cls==='knight'){ // stubble beard
    g.save();head();g.clip();g.fillStyle='rgba(50,30,18,.55)';g.beginPath();g.moveTo(cx-fw*.5,cy+fh*.12);g.bezierCurveTo(cx-fw*.45,cy+fh*.5,cx+fw*.45,cy+fh*.5,cx+fw*.5,cy+fh*.12);g.lineTo(cx+fw*.3,cy+fh*.24);g.quadraticCurveTo(cx,cy+fh*.44,cx-fw*.3,cy+fh*.24);g.closePath();g.fill();
    g.fillStyle='rgba(50,30,18,.6)';g.beginPath();g.moveTo(cx-fw*.16,cy+fh*.28);g.quadraticCurveTo(cx,cy+fh*.23,cx+fw*.16,cy+fh*.28);g.quadraticCurveTo(cx,cy+fh*.26,cx-fw*.16,cy+fh*.28);g.fill();g.restore();
    const metal=lg(cx-fw*.66,0,cx+fw*.66,0,[[0,'#2c3038'],[.28,'#cfd4de'],[.5,'#8a909c'],[.78,'#4a505c'],[1,'#1c1f26']]);
    g.fillStyle=metal;g.beginPath();g.moveTo(cx-fw*.64,cy+fh*.16);g.bezierCurveTo(cx-fw*.7,cy-fh*.82,cx+fw*.7,cy-fh*.82,cx+fw*.64,cy+fh*.16);g.lineTo(cx+fw*.5,cy+fh*.24);g.lineTo(cx+fw*.47,cy-fh*.1);g.bezierCurveTo(cx+fw*.4,cy-fh*.36,cx-fw*.4,cy-fh*.36,cx-fw*.47,cy-fh*.1);g.lineTo(cx-fw*.5,cy+fh*.24);g.closePath();g.fill();
    g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=3;g.beginPath();g.moveTo(cx-fw*.45,cy-fh*.3);g.bezierCurveTo(cx-fw*.4,cy-fh*.68,cx-fw*.1,cy-fh*.74,cx+fw*.05,cy-fh*.74);g.stroke();
    g.fillStyle=lg(cx-4,0,cx+4,0,[[0,'#4a505c'],[.5,'#dfe3ea'],[1,'#3a3f4b']]);g.fillRect(cx-3.5,cy-fh*.34,7,fh*.46);
    g.strokeStyle='#c9973f';g.lineWidth=3;g.beginPath();g.moveTo(cx,cy-fh*.36);g.bezierCurveTo(cx,cy-fh*.7,cx,cy-fh*.72,cx,cy-fh*.74);g.stroke();
    g.fillStyle='#e8c170';for(let i=0;i<7;i++){const t=i/6,x=cx-fw*.6+t*fw*1.2;g.beginPath();g.arc(x,cy-fh*.12-Math.sin(t*Math.PI)*fh*.26,1.8,0,7);g.fill();}
  }
  if(cls==='ranger'){
    g.fillStyle=lg(0,cy-60,0,cy,[[0,'#7a3a1c'],[1,'#a0542a']]);g.beginPath();g.moveTo(cx-fw*.52,cy-fh*.12);g.bezierCurveTo(cx-fw*.5,cy-fh*.62,cx+fw*.5,cy-fh*.62,cx+fw*.52,cy-fh*.12);g.quadraticCurveTo(cx+fw*.2,cy-fh*.4,cx-fw*.05,cy-fh*.3);g.quadraticCurveTo(cx-fw*.3,cy-fh*.26,cx-fw*.52,cy-fh*.12);g.fill();
    for(let i=0;i<7;i++){const y=cy+fh*.36+i*12;E(cx+fw*.44+i*1.8,y,7,8,.3,i%2?'#8a4422':'#a0542a');g.strokeStyle='rgba(40,16,6,.5)';g.lineWidth=1;g.beginPath();g.ellipse(cx+fw*.44+i*1.8,y,7,8,.3,0,Math.PI);g.stroke();}
    g.fillStyle=lg(0,30,0,200,[[0,'#4a6c38'],[1,'#22341a']]);g.beginPath();g.moveTo(cx,26);g.bezierCurveTo(cx+86,26,cx+90,130,cx+80,196);g.lineTo(cx+44,190);g.bezierCurveTo(cx+48,150,cx+44,90,cx+30,cy-fh*.52);g.bezierCurveTo(cx+10,cy-fh*.66,cx-10,cy-fh*.66,cx-30,cy-fh*.52);g.bezierCurveTo(cx-44,90,cx-48,150,cx-44,190);g.lineTo(cx-80,196);g.bezierCurveTo(cx-90,130,cx-86,26,cx,26);g.fill('evenodd');
    g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=5;g.beginPath();g.moveTo(cx-30,cy-fh*.52);g.bezierCurveTo(cx-10,cy-fh*.66,cx+10,cy-fh*.66,cx+30,cy-fh*.52);g.stroke();
  }
  if(cls==='cleric'){
    g.save();head();g.clip();glow(cx-12,cy-fh*.44,26,'rgba(255,255,255,.28)');g.restore();
    [-1,1].forEach(sd=>{g.fillStyle=lg(0,cy-30,0,cy+20,[[0,'#f2efe8'],[1,'#b8b2a6']]);g.beginPath();g.moveTo(cx+sd*fw*.44,cy-fh*.3);g.bezierCurveTo(cx+sd*fw*.62,cy-fh*.2,cx+sd*fw*.62,cy+fh*.06,cx+sd*fw*.5,cy+fh*.14);g.lineTo(cx+sd*fw*.44,cy-fh*.02);g.closePath();g.fill();});
    g.fillStyle=lg(0,cy+10,0,cy+110,[[0,'#f4f1ea'],[1,'#b0a898']]);g.beginPath();g.moveTo(cx-fw*.5,cy+fh*.1);g.bezierCurveTo(cx-fw*.56,cy+fh*.78,cx-fw*.2,cy+fh*1.02,cx,cy+fh*1.06);g.bezierCurveTo(cx+fw*.2,cy+fh*1.02,cx+fw*.56,cy+fh*.78,cx+fw*.5,cy+fh*.1);g.lineTo(cx+fw*.3,cy+fh*.24);g.quadraticCurveTo(cx,cy+fh*.46,cx-fw*.3,cy+fh*.24);g.closePath();g.fill();
    g.strokeStyle='rgba(140,130,115,.45)';g.lineWidth=1;for(let i=0;i<16;i++){const x=cx-fw*.4+i*fw*.053;g.beginPath();g.moveTo(x,cy+fh*.4);g.quadraticCurveTo(x+(r()-.5)*10,cy+fh*.75,cx+(x-cx)*.4,cy+fh*1.02);g.stroke();}
    g.fillStyle='#ece8de';g.beginPath();g.moveTo(cx-fw*.26,cy+fh*.31);g.quadraticCurveTo(cx-fw*.1,cy+fh*.2,cx,cy+fh*.25);g.quadraticCurveTo(cx+fw*.1,cy+fh*.2,cx+fw*.26,cy+fh*.31);g.quadraticCurveTo(cx+fw*.1,cy+fh*.28,cx,cy+fh*.3);g.quadraticCurveTo(cx-fw*.1,cy+fh*.28,cx-fw*.26,cy+fh*.31);g.fill();
  }
  if(cls==='sorc'){
    g.fillStyle=lg(0,cy-60,0,cy+60,[[0,'#f4f6fc'],[1,'#b8c2da']]);[-1,1].forEach(sd=>{g.beginPath();g.moveTo(cx,cy-fh*.52);g.bezierCurveTo(cx+sd*fw*.4,cy-fh*.5,cx+sd*fw*.6,cy-fh*.1,cx+sd*fw*.56,cy+fh*.5);g.lineTo(cx+sd*fw*.46,cy+fh*.5);g.bezierCurveTo(cx+sd*fw*.44,cy,cx+sd*fw*.3,cy-fh*.34,cx+sd*fw*.02,cy-fh*.4);g.closePath();g.fill();});
    g.fillStyle=lg(0,30,0,200,[[0,'#30488a'],[1,'#101a3a']]);g.beginPath();g.moveTo(cx,24);g.bezierCurveTo(cx+88,24,cx+92,130,cx+82,196);g.lineTo(cx+46,190);g.bezierCurveTo(cx+50,150,cx+46,88,cx+32,cy-fh*.54);g.bezierCurveTo(cx+10,cy-fh*.7,cx-10,cy-fh*.7,cx-32,cy-fh*.54);g.bezierCurveTo(cx-46,88,cx-50,150,cx-46,190);g.lineTo(cx-82,196);g.bezierCurveTo(cx-92,130,cx-88,24,cx,24);g.fill();
    g.strokeStyle='#b8c6e8';g.lineWidth=1.5;g.beginPath();g.moveTo(cx-33,cy-fh*.53);g.bezierCurveTo(cx-10,cy-fh*.69,cx+10,cy-fh*.69,cx+33,cy-fh*.53);g.stroke();
    g.strokeStyle='#dfe6f4';g.lineWidth=2;g.beginPath();g.moveTo(cx-fw*.46,cy-fh*.3);g.quadraticCurveTo(cx,cy-fh*.44,cx+fw*.46,cy-fh*.3);g.stroke();
    g.save();g.shadowColor='#a8c8ff';g.shadowBlur=16;E(cx,cy-fh*.4,6,6,0,'#eef4ff');g.restore();E(cx+3,cy-fh*.42,5,5,0,'#6a8ad0');
    for(let i=0;i<14;i++){const a=r()*Math.PI*2,d=70+r()*40;const x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*.8;g.save();g.shadowColor='#bcd4ff';g.shadowBlur=8;E(x,y,1.3,1.3,0,'#eef4ff');g.restore();}
  }
  // ---------- finish ----------
  g.fillStyle=rg(128,120,80,190,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.6)']]);g.fillRect(0,0,256,256);
  for(let i=0;i<900;i++){const v=r()*255|0;g.fillStyle=`rgba(${v},${v},${v},.035)`;g.fillRect(r()*256,r()*256,1,1);}
}
