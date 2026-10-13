// AUDIO (ported from the single-file build)
import '../ui/log.js'; // load-order chain: keeps the original top-to-bottom start-up order
import { ri, rnd } from '../core/state.js';

export const Au={ctx:null,on:true,
  init(){if(this.ctx)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){this.ctx=null;}},
  pad(fs,d,v=.028,delay=0){if(!this.ctx||!this.on)return;const t=this.ctx.currentTime+delay;const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(700,t);lp.frequency.linearRampToValueAtTime(1600,t+d*.5);const g=this.ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+d*.35);g.gain.linearRampToValueAtTime(v*.75,t+d*.75);g.gain.linearRampToValueAtTime(0,t+d);lp.connect(g).connect(this.ctx.destination);fs.forEach((f,i)=>{[-5,5].forEach(det=>{const o=this.ctx.createOscillator();o.type=i%2?'triangle':'sine';o.frequency.value=f;o.detune.value=det;o.connect(lp);o.start(t);o.stop(t+d+.05);});});},
  tone(f,d,type='sine',v=.12,f2,delay=0){if(!this.ctx||!this.on)return;const t=this.ctx.currentTime+delay;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(this.ctx.destination);o.start(t);o.stop(t+d+.02);},
  noise(d,v=.1,freq=800,delay=0){if(!this.ctx||!this.on)return;const t=this.ctx.currentTime+delay;const n=Math.floor(this.ctx.sampleRate*d);const b=this.ctx.createBuffer(1,n,this.ctx.sampleRate);const a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=this.ctx.createBufferSource();s.buffer=b;const f=this.ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;const g=this.ctx.createGain();g.gain.value=v;s.connect(f).connect(g).connect(this.ctx.destination);s.start(t);}
};
export function sfx(n){switch(n){
 case'step':Au.noise(.08,.05,420);break;
 case'bump':Au.tone(90,.12,'square',.06);break;
 case'hit':Au.noise(.12,.18,1600);Au.tone(160,.1,'sawtooth',.05,60);break;
 case'hurt':Au.noise(.18,.2,700);Au.tone(120,.2,'square',.05,50);break;
 case'miss':Au.noise(.1,.05,3000);break;
 case'sun':Au.tone(520,.35,'triangle',.1,1040);Au.tone(780,.35,'sine',.06,1560,.05);break;
 case'moon':Au.tone(660,.45,'sine',.1,220);Au.tone(990,.45,'triangle',.05,330,.04);break;
 case'heal':[523,659,784].forEach((f,i)=>Au.tone(f,.3,'sine',.08,null,i*.07));break;
 case'alarm':Au.tone(220,.18,'sawtooth',.07,330);Au.tone(220,.18,'sawtooth',.07,330,.2);break;
 case'win':[392,523,659,784].forEach((f,i)=>Au.tone(f,.35,'triangle',.09,null,i*.11));break;
 case'level':[523,659,784,1047].forEach((f,i)=>Au.tone(f,.4,'sine',.09,null,i*.09));break;
 case'coin':Au.tone(1320,.08,'square',.05);Au.tone(1760,.12,'square',.05,null,.07);break;
 case'tide':Au.tone(110,.8,'sawtooth',.1,55);Au.noise(.8,.12,300);break;
 case'thunder':Au.noise(2.6,.32,160);Au.noise(1.2,.18,700,.05);Au.tone(48,2.2,'sine',.12,30);break;
 case'drip':Au.tone(rnd(1400,2200),.09,'sine',.035,rnd(600,900));break;
 case'bird':{const b=rnd(2200,3200);for(let i=0;i<ri(2,4);i++)Au.tone(b+rnd(-300,300),.09,'sine',.028,b*1.35,i*.13);break;}
 case'owl':Au.tone(392,.35,'sine',.05,370);Au.tone(392,.55,'sine',.05,340,.5);break;
 case'howl':Au.tone(330,2.2,'triangle',.035,520);Au.tone(520,1.2,'triangle',.03,380,2);break;
 case'bell':[0,1.6,3.2].forEach(d=>{Au.tone(196,2.4,'sine',.05,null,d);Au.tone(392,1.8,'sine',.025,null,d);Au.tone(588,1.2,'sine',.015,null,d);});break;
 case'groan':Au.tone(90,1.6,'sawtooth',.02,55);Au.noise(1.4,.03,300);break;
 case'chain':for(let i=0;i<5;i++)Au.tone(rnd(1800,2600),.05,'square',.012,null,i*.07);break;
 case'chime':[1320,1760,2217].forEach((f,i)=>Au.tone(f,1.4,'sine',.02,null,i*.22));break;
 case'ecl':[196,233,294,392].forEach((f,i)=>Au.tone(f,1.2,'sine',.07,null,i*.15));break;
 case'door':Au.tone(70,.5,'square',.07,40);Au.noise(.5,.08,250);break;
}}
