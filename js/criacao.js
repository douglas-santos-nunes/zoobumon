'use strict';
/* =================== criação de personagem =================== */
const C={look:{sex:'m',style:'curto',beard:'nenhuma',beardColor:HAIR[0],hair:HAIR[0],skin:SKIN[0],shirt:SHIRT[0],pants:PANTS[0]},starter:'pintobrasa'};
function renderCreate(){
  const L=C.look,chips=(attr,obj,cur)=>Object.entries(obj).map(([k,n])=>`<button type="button" class="chipbtn" data-${attr}="${k}" aria-pressed="${cur===k}">${n}</button>`).join('');
  $('#sexes').innerHTML=chips('sex',{m:'Masculino',f:'Feminino'},L.sex);
  $('#styles').innerHTML=chips('style',HAIRSTYLES[L.sex],L.style);
  $('#beardRow').hidden=L.sex!=='m';
  $('#beards').innerHTML=chips('beard',BEARDS,L.beard);
  $('#starters').innerHTML=['pintobrasa','gotinho','brotelo'].map(k=>`<button type="button" class="card" data-st="${k}" aria-pressed="${C.starter===k}"><img src="${icon(k)}" alt=""><b>${SPECIES[k].n}</b>${chip(SPECIES[k].t)}</button>`).join('');
  const rows=[['hair','Cabelo',HAIR],...(L.sex==='m'&&L.beard!=='nenhuma'?[['beardColor','Barba',BEARDC]]:[]),['skin','Pele',SKIN],['shirt','Roupa',SHIRT],['pants','Calça',PANTS]];
  $('#looks').innerHTML=rows.map(([k,l,arr])=>`<div class="lookrow"><span>${l}</span><div class="sw">${arr.map(c=>`<button type="button" data-k="${k}" data-c="${c}" style="background:${c}" aria-label="${l} ${c}" aria-pressed="${C.look[k]===c}"></button>`).join('')}</div></div>`).join('');
}
$('#create').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.sex){C.look.sex=b.dataset.sex;if(!HAIRSTYLES[C.look.sex][C.look.style])C.look.style=Object.keys(HAIRSTYLES[C.look.sex])[0];if(C.look.sex==='f')C.look.beard='nenhuma'}
  else if(b.dataset.style)C.look.style=b.dataset.style;
  else if(b.dataset.beard)C.look.beard=b.dataset.beard;
  else if(b.dataset.st)C.starter=b.dataset.st;
  else if(b.dataset.k){
    // a barba acompanha a cor do cabelo até a pessoa escolher outra cor pra ela
    if(b.dataset.k==='beardColor')C.beardPicked=true;
    if(b.dataset.k==='hair'&&!C.beardPicked)C.look.beardColor=b.dataset.c;
    C.look[b.dataset.k]=b.dataset.c;
  }
  else return;
  renderCreate();pvSpr=buildChar(C.look);
});
let pvSpr=null,pvT=0;
// a prévia fica parada e de frente; os botões giram o boneco
const PV_DIRS=['down','left','up','right'];let pvDir=0;
$('#rotL').addEventListener('click',()=>{pvDir=(pvDir+1)%4});
$('#rotR').addEventListener('click',()=>{pvDir=(pvDir+3)%4});
function drawPreview(ts){
  if(!$('#create').hidden&&pvSpr){
    const g=$('#pv').getContext('2d');g.imageSmoothingEnabled=false;
    for(let y=0;y<3;y++)for(let x=0;x<3;x++)g.drawImage(T.grass[(x+y*2)%4],x*TS,y*TS);
    const dir=PV_DIRS[pvDir];
    g.fillStyle='rgba(20,40,20,.26)';g.beginPath();g.ellipse(48,73,9,3.5,0,0,7);g.fill();
    g.drawImage(pvSpr[dir][0],32,26);
  }
  requestAnimationFrame(drawPreview);
}
function startGame(s,isNew){
  S=s;
  S.bag=S.bag||{};S.gear=S.gear||[];S.eq=S.eq||[];S.box=S.box||[];S.wins=S.wins||0;S.caught=S.caught||1;S.txp=S.txp||0;
  // zoobumons de espécies que saíram do jogo somem do save; golpes que saíram também
  const ok=m=>m&&SPECIES[m.s];
  for(const m of [...S.party,...S.box].filter(ok)){m.moves=(m.moves||[]).filter(k=>MOVES[k]);if(!m.moves.length)m.moves=['investida']}
  S.party=S.party.filter(ok);S.box=S.box.filter(ok);
  while(S.party.length<1&&S.box.length)S.party.push(S.box.shift());
  S.respawn=S.respawn||{x:6,y:7};
  S.skins=S.skins||[];S.look.acc=S.look.acc||{};
  scene=S.pos&&INT[S.pos.sc]?S.pos.sc:'mundo';
  P.x=S.pos?.x??6;P.y=S.pos?.y??7;P.dir=S.pos?.dir||'down';P.moving=false;
  refreshLook();
  $('#create').hidden=true;$('#game').hidden=false;document.body.classList.add('playing');resize();
  refreshCode();
  started=true;mode='world';curZone=zoneAt(P.x,P.y);if(scene==='mundo')showLoc(curZone);else showLocText(INT[scene].name);
  startOnline();
  if(isNew)run(async()=>{
    await say(`Bem-vindo ao mundo dos zoobumons, ${S.name}!`);
    await say(`Você e ${nameOf(S.party[0])} começam aqui na Vila Aurora.`);
    await say('Toque em qualquer lugar do mapa pra andar até lá. Toque numa pessoa ou porta pra falar ou entrar.');
    await say('Fale com o Prof. Ipê e vá pro mato alto da Trilha 1, ao sul, pra caçar zoobumons.');
    await say('O botão Menu, no canto de cima, mostra seus zoobumons, a bolsa, sua ficha e o Duelo.');
    save();
  });
}
$('#btnStart').addEventListener('click',()=>{
  const name=($('#nm').value.trim()||'Treinador').slice(0,20);
  startGame({v:1,name,cls:null,look:{...C.look},starter:C.starter,coins:300,txp:0,
    party:[mkMon(C.starter,6)],box:[],bag:{pocao:3,rede:5},gear:[],eq:[],caught:1,wins:0,rivalMet:false},true);
});
$('#btnCont').addEventListener('click',()=>{if(savedGame)startGame(savedGame,false)});

