'use strict';
/* =================== som: músicas chiptune e efeitos, tudo gerado na hora (Web Audio) =================== */
// O navegador só libera som depois do primeiro toque/tecla; até lá tudo fica em silêncio.
const AU={ctx:null,master:null,music:null,sfx:null,musicOn:true,sfxOn:true,track:null,want:null,ch:[],timer:0,duck:0};
// cada um escolhe: tem gente que gosta dos efeitos mas não da música (o ajuste antigo de 'som' desligado vale pros dois)
try{const old=localStorage.getItem('zoobumon-som')==='0',m=localStorage.getItem('zoobumon-musica'),e=localStorage.getItem('zoobumon-efeitos');
  AU.musicOn=m?m==='1':!old;AU.sfxOn=e?e==='1':!old}catch(e){}

const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
function n2f(n){const m=/^([A-G]#?)(\d)$/.exec(n);if(!m)return 0;return 440*2**((NOTE[m[1]]+(+m[2]+1)*12-69)/12)}
// "E5:2 G5:1 -:1" vira [[nota,duração em colcheias],...]
const seq=s=>s.trim().split(/\s+/).map(t=>{const[n,l]=t.split(':');return[n,+l||1]});

// meio segundo de silêncio em WAV, gerado aqui mesmo (sem arquivo)
function silentWav(){
  const n=4000,b=new Uint8Array(44+n),v=new DataView(b.buffer),w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i)};
  w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);b.fill(128,44);
  let s='';for(const x of b)s+=String.fromCharCode(x);return'data:audio/wav;base64,'+btoa(s);
}
function auInit(){
  if(!AU.ctx){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const c=AU.ctx=new C();
    AU.master=c.createGain();AU.master.gain.value=1;AU.master.connect(c.destination);
    AU.music=c.createGain();AU.music.gain.value=AU.musicOn?.16:0;AU.music.connect(AU.master);
    AU.sfx=c.createGain();AU.sfx.gain.value=AU.sfxOn?.3:0;AU.sfx.connect(AU.master);
    const len=c.sampleRate*.5,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.noise=b;
    AU.timer=setInterval(schedule,40);
  }
  const c=AU.ctx;
  // o iPhone deixa o áudio "suspenso" (ou "interrompido") até um toque que conte de verdade
  if(c.state!=='running')c.resume().catch(()=>{});
  if(!AU.unlocked){
    // tocar um som vazio dentro do toque libera o áudio de vez no iOS
    try{const s=c.createBufferSource();s.buffer=c.createBuffer(1,1,22050);s.connect(c.destination);s.start(0)}catch(e){}
    // com o botão de silencioso do iPhone ligado o Safari corta o som do navegador;
    // tocar um <audio> (em silêncio, em loop) muda o áudio pro modo "reprodução" e o jogo volta a ter som
    try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
    try{
      const a=AU.silent||(AU.silent=new Audio(silentWav()));a.loop=true;a.setAttribute('playsinline','');
      const p=a.play();if(p)p.then(()=>{AU.unlocked=true}).catch(()=>{});
    }catch(e){}
  }
}
// pointerdown sozinho não conta como toque pro iOS liberar áudio: escuta também o fim do toque e o clique
for(const ev of['pointerdown','touchstart','touchend','mouseup','click','keydown'])addEventListener(ev,auInit,{passive:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&AU.ctx&&AU.ctx.state!=='running')AU.ctx.resume().catch(()=>{})});

// uma nota com envelope curto (estilo GBA): ataque rápido, cai pro sustain e solta
function tone(t,f,dur,type,vol,dest,slide){
  if(!f)return;const c=AU.ctx,o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.linearRampToValueAtTime(vol*.6,t+Math.min(.08,dur*.5));
  g.gain.setValueAtTime(vol*.6,t+dur*.85);g.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.02);
}
function noise(t,dur,vol,dest,hp=1000){
  const c=AU.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=AU.noise;f.type='highpass';f.frequency.value=hp;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(dest);s.start(t);s.stop(t+dur+.02);
}
function drum(t,k,dest){
  if(k==='k')tone(t,150,.12,'sine',.9,dest,45);
  else if(k==='s')noise(t,.12,.5,dest,1800);
  else if(k==='h')noise(t,.04,.22,dest,7000);
}

// ---- músicas (composições originais, 8 compassos em loop) ----
const BASS=(ch,rep)=>ch.map(c=>rep(c)).join(' ');
const pump={C:'C3:1 C4:1 G3:1 C4:1 C3:1 C4:1 G3:1 C4:1',F:'F2:1 F3:1 C3:1 F3:1 F2:1 F3:1 C3:1 F3:1',G:'G2:1 G3:1 D3:1 G3:1 G2:1 G3:1 D3:1 G3:1',Am:'A2:1 A3:1 E3:1 A3:1 A2:1 A3:1 E3:1 A3:1'};
const TRACKS={
  mundo:{bpm:132,
    lead:seq('E5:2 G5:2 C6:2 B5:1 A5:1 G5:4 E5:2 -:2 F5:2 A5:2 D6:2 C6:1 B5:1 A5:6 -:2 G5:2 E5:1 G5:1 C6:2 E6:2 D6:2 C6:1 B5:1 A5:2 G5:2 F5:2 A5:1 G5:1 F5:2 D5:2 C5:6 -:2'),
    bass:seq(BASS(['C','C','F','F','C','G','F','C'],c=>pump[c])),
    drums:'k.h.s.h.'.repeat(8)},
  batalha:{bpm:168,
    lead:seq('A5:1 -:1 A5:1 C6:1 E6:2 D6:2 C6:1 B5:1 A5:2 E5:4 F5:1 -:1 F5:1 A5:1 C6:2 B5:2 A5:1 G5:1 F5:2 E5:4 A5:1 -:1 A5:1 C6:1 E6:2 G6:2 F6:1 E6:1 D6:2 C6:2 B5:2 C6:2 B5:2 A5:2 G#5:2 A5:6 -:2'),
    bass:seq(BASS(['Am','Am','F','E','Am','Dm','E','Am'],c=>({Am:'A2:1 A3:1',F:'F2:1 F3:1',E:'E2:1 E3:1',Dm:'D2:1 D3:1'})[c].repeat(4).replace(/(\d)(?=[A-G])/g,'$1 '))),
    drums:'khshkksh'.repeat(8)},
  interior:{bpm:104,
    lead:seq('A5:2 C6:2 F5:2 A5:2 G5:3 F5:1 E5:4 G5:2 A#5:2 E5:2 G5:2 F5:6 -:2 A5:2 C6:2 D6:2 C6:2 A#5:3 A5:1 G5:4 A5:2 G5:2 F5:2 E5:2 F5:6 -:2'),
    bass:seq(BASS(['F','C','C','F','F','A#','C','F'],c=>({F:'F2:4 C3:4',C:'C3:4 G2:4','A#':'A#2:4 F3:4'})[c])),
    drums:'..h...h.'.repeat(8)},
  evolucao:{bpm:120,
    lead:seq('C5:1 E5:1 G5:1 C6:1 D5:1 F5:1 A5:1 D6:1 E5:1 G5:1 B5:1 E6:1 F5:1 A5:1 C6:1 F6:1'),
    bass:seq('C3:4 D3:4 E3:4 F3:4'),drums:'h.h.h.h.h.h.h.h.'},
};
// jingles curtos: tocam uma vez por cima e a música volta depois
const JINGLES={
  vitoria:{bpm:150,lead:seq('G5:1 G5:1 G5:1 C6:3 A#5:2 C6:1 -:1 D6:1 C6:5'),bass:seq('C3:3 C3:3 A#2:2 C3:2 G2:1 C3:5')},
  captura:{bpm:160,lead:seq('G5:1 C6:1 E6:1 G6:3 E6:1 G6:4'),bass:seq('C3:3 E3:3 C3:5')},
  levelup:{bpm:180,lead:seq('C6:1 E6:1 G6:1 C7:3'),bass:seq('C4:3 C3:3')},
  cura:{bpm:140,lead:seq('C6:1 E6:1 G6:1 E6:1 F6:1 A6:1 C7:4'),bass:seq('C3:2 C3:2 F3:2 C3:4')},
  evoluiu:{bpm:140,lead:seq('E6:1 D6:1 E6:1 G6:2 C7:5'),bass:seq('C3:2 G2:2 C3:6')},
};

function startTrack(name){
  AU.track=name;const T=TRACKS[name];AU.ch=[];if(!T||!AU.ctx)return;
  const t0=AU.ctx.currentTime+.08,e=60/T.bpm/2;
  AU.ch.push({kind:'lead',list:T.lead,i:0,t:t0,e},{kind:'bass',list:T.bass,i:0,t:t0,e});
  if(T.drums)AU.ch.push({kind:'drum',list:[...T.drums].map(k=>[k,1]),i:0,t:t0,e});
}
function playNote(kind,n,t,dur){
  if(n==='-'||n==='.')return;
  if(kind==='drum')return drum(t,n,AU.music);
  if(kind==='lead')tone(t,n2f(n),dur*.92,'square',.32,AU.music);else tone(t,n2f(n),dur*.95,'triangle',.55,AU.music);
}
function schedule(){
  if(!AU.ctx)return;
  if(AU.want!==AU.track&&AU.ctx.currentTime>AU.duck)startTrack(AU.want);
  if(AU.ctx.currentTime<AU.duck)return;
  const until=AU.ctx.currentTime+.25;
  for(const c of AU.ch)while(c.t<until){const[n,l]=c.list[c.i];playNote(c.kind,n,c.t,l*c.e);c.t+=l*c.e;c.i=(c.i+1)%c.list.length}
}
// qual música combina com o momento do jogo (chamado a cada quadro)
function musicTick(){
  AU.want=!started?'interior':mode==='evo'?'evolucao':mode==='battle'?'batalha':scene!=='mundo'?'interior':'mundo';
}
function jingle(name){
  if(!AU.ctx)return;const J=JINGLES[name];if(!J)return;
  const c=AU.ctx,e=60/J.bpm/2;let t=c.currentTime+.05,tb=t,end=t;
  for(const[n,l]of J.lead){playNote('lead',n,t,l*e);t+=l*e}
  for(const[n,l]of J.bass){playNote('bass',n,tb,l*e);tb+=l*e}
  end=Math.max(t,tb);
  // a música para enquanto o jingle toca e recomeça do início depois
  AU.ch=[];AU.track=null;AU.duck=end+.15;
}
// efeitos
function sfx(k){
  if(!AU.ctx||!AU.sfxOn)return;const t=AU.ctx.currentTime+.01,d=AU.sfx;
  switch(k){
    case'cursor':tone(t,1046,.035,'square',.25,d);break;
    case'ok':tone(t,784,.05,'square',.3,d);tone(t+.05,1175,.07,'square',.3,d);break;
    case'volta':tone(t,659,.05,'square',.3,d);tone(t+.05,440,.07,'square',.3,d);break;
    case'texto':tone(t,880,.03,'square',.15,d);break;
    case'hit':noise(t,.12,.7,d,600);tone(t,220,.12,'square',.35,d,80);break;
    case'superhit':noise(t,.2,.9,d,400);tone(t,330,.2,'square',.45,d,60);tone(t+.06,180,.18,'square',.35,d,50);break;
    case'fraco':noise(t,.08,.4,d,1500);tone(t,180,.08,'square',.2,d,120);break;
    case'erro':tone(t,300,.18,'triangle',.4,d,150);break;
    case'desmaio':tone(t,640,.55,'square',.35,d,70);break;
    case'lanca':noise(t,.35,.3,d,3000);tone(t,400,.3,'triangle',.25,d,900);break;
    case'sacode':tone(t,130,.08,'square',.4,d,90);noise(t,.05,.35,d,2500);break;
    case'escapa':tone(t,500,.12,'square',.35,d,1200);noise(t,.15,.5,d,1200);break;
    case'porta':noise(t,.06,.4,d,1500);tone(t,196,.07,'square',.3,d);tone(t+.08,262,.09,'square',.3,d);break;
    case'moeda':tone(t,1318,.06,'square',.3,d);tone(t+.06,1760,.14,'square',.3,d);break;
    case'encontro':for(let i=0;i<8;i++)tone(t+i*.045,330*2**(i/6),.05,'square',.28,d);break;
    case'mato':noise(t,.07,.18,d,3500);break;
  }
}
function setMusica(on){AU.musicOn=on;try{localStorage.setItem('zoobumon-musica',on?'1':'0')}catch(e){}if(AU.music)AU.music.gain.value=on?.16:0;somLabel()}
function setEfeitos(on){AU.sfxOn=on;try{localStorage.setItem('zoobumon-efeitos',on?'1':'0')}catch(e){}if(AU.sfx)AU.sfx.gain.value=on?.3:0;somLabel()}
function somLabel(){
  const b=$('#somBtn');if(!b)return;b.textContent=AU.musicOn||AU.sfxOn?'♪ Som':'♪ Mudo';
  const m=document.querySelector('#somPop [data-som=musica]'),e=document.querySelector('#somPop [data-som=efeitos]');
  if(m){m.textContent=`Música: ${AU.musicOn?'ligada':'desligada'}`;m.setAttribute('aria-pressed',String(AU.musicOn))}
  if(e){e.textContent=`Efeitos: ${AU.sfxOn?'ligados':'desligados'}`;e.setAttribute('aria-pressed',String(AU.sfxOn))}
}
// nome antigo (algum arquivo velho em cache ainda pode chamar)
function setSom(on){setMusica(on);setEfeitos(on)}
// telinha do som: música e efeitos separados
async function somMenu(){
  let sel=0;
  while(true){
    const i=await choose([{label:`Música: ${AU.musicOn?'LIGADA':'DESLIGADA'}`},{label:`Efeitos: ${AU.sfxOn?'LIGADOS':'DESLIGADOS'}`},{label:'VOLTAR'}],{cls:'side',start:sel});
    if(i<0||i===2)return;
    sel=i;if(i===0)setMusica(!AU.musicOn);else{setEfeitos(!AU.sfxOn);sfx('ok')}
  }
}
