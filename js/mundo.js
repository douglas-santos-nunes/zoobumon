'use strict';
/* =================== mundo =================== */
const DIRV={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const OPP={up:'down',down:'up',left:'right',right:'left'};
const NPCS=[
  {x:9,y:10,dir:'down',name:'Prof. Ipê',look:{style:'raspado',beard:'cheia',hair:'#e4e4ec',skin:'#f8d4ac',shirt:'#f4f4f4',pants:'#5868a0'},talk:async()=>{
    await say(`Prof. Ipê: Olá, ${S.name}! Os zoobumons vivem no mato alto.`);
    await say('Enfraqueça um zoobumon e jogue uma Rede. Quanto menos vida ele tiver, mais fácil de pegar.');
    await say('Ao sul fica a Trilha 1 (Nv 2 a 5). A leste, a Pedreira Seca (Nv 6 a 10).');
    await say('E no sudeste, o Bosque Sombrio (Nv 9 a 15). Só vá bem treinado!');
  }},
  {x:16,y:10,dir:'down',name:'Kael',look:{style:'espetado',hair:'#c83030',skin:'#dca474',shirt:'#2c2c34',pants:'#3a4a7c'},talk:n=>rivalTalk(n)},
  {x:13,y:13,dir:'left',name:'Lia',look:{sex:'f',style:'rabo',hair:'#e8c050',skin:'#f8d4ac',shirt:'#8848c0',pants:'#2a2a32'},talk:async()=>{
    await say('Lia: Pode arrastar o dedo no mapa que você vai seguindo. As Botas Velozes da Loja deixam mais rápido.');
    await say('Lia: E no Menu tem o Duelo. Troque códigos com amigos e lute contra o time deles!');
  }},
  {x:31,y:9,dir:'down',name:'Montanhista',look:{style:'black',beard:'cavanhaque',hair:'#3a2a22',skin:'#a8703e',shirt:'#e0a020',pants:'#4f6a4a'},talk:async()=>{
    await say('Montanhista: Zoobumons de Pedra aguentam muita pancada.');
    await say('Mas golpes de Água e de Planta derrubam eles rapidinho.');
  }},
  {x:29,y:33,dir:'right',name:'Guarda',look:{style:'topete',beard:'bigode',hair:'#3a2a22',skin:'#6e4626',shirt:'#38a050',pants:'#2a2a32'},talk:async()=>{
    await say('Guarda: O Bosque Sombrio é perigoso. Dizem que um Voltaro aparece por aqui...');
    await say('Ele é rápido e quase impossível de pegar. Leve Redes de Ouro.');
  }},
];
// gente de dentro do Centro e da Loja
const INT_NPCS={
  centro:[{x:6,y:2,dir:'down',name:'Enfermeira',fixed:1,look:{sex:'f',style:'coque',hair:'#f08aa8',skin:'#f8d4ac',shirt:'#f4f4f4',pants:'#e8e8f0',acc:{cabeca:'touca'}},talk:async()=>{
    await say('Enfermeira: Bem-vindo à UPA! Vou cuidar do seu time.');
    await fadeTo(.6,200,'#fff');healAll();S.respawn={x:6,y:7};await fadeTo(0,300);
    await say('Pronto! Seus zoobumons estão novinhos em folha. Volte sempre!');save();
  }}],
  loja:[{x:2,y:3,dir:'down',name:'Vendedor',fixed:1,look:{style:'curto',hair:'#3a2a22',skin:'#dca474',shirt:'#3870d0',pants:'#2a2a32',acc:{cabeca:'bone_azul'}},talk:()=>shopMenu()},
    {x:6,y:6,dir:'up',name:'Cliente',look:{sex:'f',style:'chanel',hair:'#3a2a22',skin:'#a8703e',shirt:'#e0a020',pants:'#3a4a7c'},talk:async()=>{
      await say('Cliente: Tô juntando moeda pra comprar a Coroa Dourada. Imagina chegar no duelo de coroa!');}}],
};
const sceneNPCs=()=>scene==='mundo'?NPCS:INT_NPCS[scene];
const SOLID='T~RB#CMPpbS';
function solid(x,y){if(SOLID.includes(tileAt(x,y)))return true;return sceneNPCs().some(n=>n.x===x&&n.y===y)}
let curZone=null;
// o mato balança um instante quando alguém entra nele
let rustle=null;
function onStep(){
  if(scene!=='mundo'){if(tileAt(P.x,P.y)==='E'){path.length=0;goal=null;run(exitBuilding)}return}
  if(tileAt(P.x,P.y)===',')rustle={x:P.x,y:P.y,until:performance.now()+260};
  const z=zoneAt(P.x,P.y);if(z!==curZone){curZone=z;showLoc(z)}
  if(tileAt(P.x,P.y)===','&&rnd()<.1*bon(S).enc){path.length=0;goal=null;run(startWild)}
}
// caminho até o ponto tocado (busca em largura no grid)
let path=[],goal=null,camX=0,camY=0;
function findPath(sx,sy,tx,ty){
  const target=solid(tx,ty)||!!peerAt(tx,ty);
  const near=(x,y)=>target?Math.abs(x-tx)+Math.abs(y-ty)===1:x===tx&&y===ty;
  if(near(sx,sy))return[];
  const prev=new Map([[sy*MW+sx,-1]]),q=[[sx,sy]];
  while(q.length){
    const[x,y]=q.shift();
    for(const d of DIRS){
      const nx=x+DIRV[d][0],ny=y+DIRV[d][1],k=ny*MW+nx;
      if(prev.has(k)||solid(nx,ny))continue;
      prev.set(k,y*MW+x);
      if(near(nx,ny)){const out=[];let c=k;while(c!==sy*MW+sx){out.unshift([c%MW,Math.floor(c/MW)]);c=prev.get(c)}return out}
      q.push([nx,ny]);
    }
  }
  return null;
}
function update(dt){
  updateOthers(dt);
  for(const n of sceneNPCs()){n.tm=(n.tm??2+rnd()*3)-dt;if(n.tm<0){n.tm=2+rnd()*4;if(!busy&&!n.fixed&&n.name!=='Prof. Ipê')n.dir=DIRS[ri(0,3)]}}
  if(mode!=='world')return;
  if(P.moving){
    const spd=(held.b||path.length?7:4.4)+(bon(S).spd?2.2:0);
    P.t+=dt*spd;
    if(P.t>=1){P.x=P.tx;P.y=P.ty;P.moving=false;P.t=0;P.step^=1;onStep()}
    return;
  }
  if(busy)return;
  let d=curDir();
  if(d){path.length=0;goal=null}
  if(needRelease){if(d)return;needRelease=false}
  if(!d&&path.length){
    const[nx,ny]=path[0];
    d=DIRS.find(k=>P.x+DIRV[k][0]===nx&&P.y+DIRV[k][1]===ny);
    if(!d||solid(nx,ny)){path.length=0;goal=null;return}
    path.shift();
  }else if(!d&&goal){
    // chegou do lado de algo: vira pra ele e interage
    const g=goal;goal=null;
    if(g.act){const k=DIRS.find(k=>P.x+DIRV[k][0]===g.x&&P.y+DIRV[k][1]===g.y);if(k){P.dir=k;worldPress('a')}}
    return;
  }
  if(!d)return;
  P.dir=d;
  const[dx,dy]=DIRV[d],nx=P.x+dx,ny=P.y+dy;
  const b=buildingAt(nx,ny);
  if(b&&b.door[0]===nx&&b.door[1]===ny){run(()=>enterBuilding(b));return}
  if(solid(nx,ny))return;
  P.tx=nx;P.ty=ny;P.moving=true;P.t=0;
}
function worldPress(b){
  if(busy||P.moving)return;
  if(b==='start'){run(startMenu);return}
  if(b!=='a')return;
  const[dx,dy]=DIRV[P.dir],fx=P.x+dx,fy=P.y+dy;
  const op=peerAt(fx,fy);
  if(op){run(()=>duelPeer(op));return}
  // atrás do balcão: fala com quem está do outro lado
  const t0=tileAt(fx,fy),bx=t0==='C'?fx+dx:fx,by=t0==='C'?fy+dy:fy;
  const n=sceneNPCs().find(n=>n.x===bx&&n.y===by);
  if(n){n.dir=OPP[P.dir];run(()=>n.talk(n));return}
  if(t0==='P'){run(pcMenu);return}
  if(t0==='M'){run(()=>say('A máquina de cura zumbe baixinho. Fale com a Enfermeira pra usar.'));return}
  if(t0==='S'){run(()=>say('Prateleiras cheias de Redes, Poções e umas skins bem chamativas.'));return}
  if(t0==='p'){run(()=>say('Uma planta bem cuidada. Alguém rega ela todo dia.'));return}
  if(t0==='b'){run(()=>say('Um banco de espera. Tá fofinho.'));return}
  if(t0==='C'){run(()=>say('Um balcão. Não tem ninguém atendendo aqui.'));return}
  const bd=buildingAt(fx,fy);
  if(bd&&bd.door[0]===fx&&bd.door[1]===fy){run(()=>enterBuilding(bd));return}
  const t=tileAt(fx,fy);
  if(t==='~')run(()=>say('A água está calma e funda. Melhor não nadar.'));
  else if(t==='R')run(()=>say('Uma pedra enorme. Não dá pra mover.'));
  else if(bd)run(()=>say(bd.kind==='centro'?'UPA: cura grátis e o PC pra guardar seus zoobumons.':'Loja da Vila: itens, equipamentos e skins.'));
}
// entra no Centro ou na Loja: troca de cena e aparece em cima do tapete da porta
async function enterBuilding(b){
  await fadeTo(1,220,'#000');
  scene=b.kind;const I=INT[scene];
  P.x=I.entry[0];P.y=I.entry[1];P.dir='up';P.moving=false;path.length=0;goal=null;needRelease=true;
  showLocText(I.name);
  await fadeTo(0,220);save();
}
async function exitBuilding(){
  await fadeTo(1,220,'#000');
  const d=INT[scene].door;scene='mundo';
  P.x=d[0];P.y=d[1]+1;P.dir='down';P.moving=false;needRelease=true;curZone=zoneAt(P.x,P.y);
  await fadeTo(0,220);save();
}

