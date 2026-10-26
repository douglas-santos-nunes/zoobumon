'use strict';
/* =================== online: amigos no mapa e duelo ao vivo =================== */
// Todos entram no canal "mundo" do Supabase Realtime.
// - presença: cada um publica nome, visual, posição e o código do time; os outros desenham no mapa
// - mensagens: desafio, resposta e a ação de cada turno do duelo
// O duelo é calculado nos dois aparelhos com a mesma semente de sorteio, então os dois veem o mesmo resultado.
let chan=null,lastPres='';
const OTHERS=new Map();
const HEX=/^#[0-9a-f]{6}$/i;
function safeLook(l){l=l&&typeof l==='object'?l:{};const sex=l.sex==='f'?'f':'m';return{sex,style:HAIRSTYLES[sex][l.style]?l.style:Object.keys(HAIRSTYLES[sex])[0],beard:sex==='m'&&BEARDS[l.beard]?l.beard:'nenhuma',beardColor:HEX.test(l.beardColor)?l.beardColor:undefined,hair:HEX.test(l.hair)?l.hair:HAIR[0],skin:HEX.test(l.skin)?l.skin:SKIN[0],shirt:HEX.test(l.shirt)?l.shirt:SHIRT[0],pants:HEX.test(l.pants)?l.pants:PANTS[0],acc:Object.fromEntries(Object.entries(l.acc&&typeof l.acc==='object'?l.acc:{}).filter(([slot,id])=>SKINS[id]&&SKINS[id].slot===slot))}}
const cleanName=n=>String(n||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,20)||'Amigo';
const peerName=o=>cleanName(o&&o.p&&o.p.n);
// amigos só aparecem quando estão na mesma sala (mundo, Centro ou Loja)
const sameRoom=o=>(o.p.sc||'mundo')===scene;
function peerAt(x,y){for(const o of OTHERS.values())if(sameRoom(o)&&o.p.x===x&&o.p.y===y)return o;return null}

function sendPresence(){
  if(!chan||!S||!started)return;
  const o={n:S.name.slice(0,20),l:S.look,x:P.moving?P.tx:P.x,y:P.moving?P.ty:P.y,d:P.dir,b:mode==='world'&&!busy?0:1,lv:Math.max(...S.party.map(m=>m.lv)),c:myCode(),sc:scene};
  const k=JSON.stringify(o);
  if(k!==lastPres){lastPres=k;chan.track(o).catch(()=>{})}
}
function syncPeers(){
  const st=chan.presenceState(),seen=new Set();
  for(const[id,arr]of Object.entries(st)){
    if(me&&id===me.id)continue;
    const pr=arr[arr.length-1];
    if(!pr||!Number.isInteger(pr.x)||!Number.isInteger(pr.y)||pr.x<0||pr.y<0||pr.x>=MW||pr.y>=MH)continue;
    seen.add(id);
    let o=OTHERS.get(id);
    if(!o){o={id,rx:pr.x,ry:pr.y};OTHERS.set(id,o)}
    const lk=JSON.stringify(pr.l||{});
    if(o.lk!==lk){o.lk=lk;o.spr=buildChar(safeLook(pr.l))}
    o.p={...pr,d:DIRS.includes(pr.d)?pr.d:'down'};
  }
  for(const[id,o]of OTHERS)if(!seen.has(id)){if(o.tag)o.tag.remove();OTHERS.delete(id)}
}
function updateOthers(dt){
  for(const o of OTHERS.values()){
    const dx=o.p.x-o.rx,dy=o.p.y-o.ry,d=Math.hypot(dx,dy);
    if(d>3){o.rx=o.p.x;o.ry=o.p.y}else if(d>0){const s=Math.min(d,dt*6);o.rx+=dx/d*s;o.ry+=dy/d*s}
    o.moving=d>.05;o.anim=(o.anim||0)+dt;
  }
}
function othersActors(){
  const out=[];
  for(const o of OTHERS.values()){if(!sameRoom(o))continue;const f=o.moving?[1,0,2,0][Math.floor(o.anim*7)%4]:0;out.push({x:Math.round(o.rx*TS),y:Math.round(o.ry*TS),img:o.spr[o.p.d][f]})}
  return out;
}
function drawTags(){
  const box=$('#tags'),g=$('#game'),sc=g.clientWidth/VW,show=mode==='world';
  for(const o of OTHERS.values()){
    let el=o.tag;if(!el){el=o.tag=document.createElement('div');el.className='tag';box.appendChild(el)}
    const txt=`${peerName(o)} · Nv${clamp(o.p.lv|0,1,100)}${o.p.b?' · ocupado':''}`;
    if(el.textContent!==txt)el.textContent=txt;
    const vis=show&&sameRoom(o);if(el.hidden===vis)el.hidden=!vis;
    el.style.transform=`translate(${Math.round((o.rx*TS-camX+TS/2)*sc)}px,${Math.round((o.ry*TS-camY-20)*sc)}px) translate(-50%,-100%)`;
  }
  const n=OTHERS.size,on=$('#online'),vis=!!(chan&&show);
  if(on.hidden===vis)on.hidden=!vis;
  const t=n?`${n} ${n>1?'amigos':'amigo'} online`:'Só você online';
  if(on.textContent!==t)on.textContent=t;
}
let toastT=0;
function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),5000)}

// ---- mensagens ----
const inbox=[],waiters=[];
function sendMsg(event,payload){if(!chan||!me)return Promise.resolve();return chan.send({type:'broadcast',event,payload:{...payload,from:me.id}}).catch(()=>{})}
function onMsg(type,p){
  if(!p||!me||p.to!==me.id)return;
  const w=waiters.find(w=>w.type===type&&w.match(p));
  if(w){waiters.splice(waiters.indexOf(w),1);w.res(p);return}
  inbox.push({type,p,at:Date.now()});
  while(inbox.length>50)inbox.shift();
}
function waitMsg(type,match,ms){
  const i=inbox.findIndex(m=>m.type===type&&match(m.p));
  if(i>=0)return Promise.resolve(inbox.splice(i,1)[0].p);
  return new Promise(res=>{const w={type,match,res};waiters.push(w);setTimeout(()=>{const k=waiters.indexOf(w);if(k>=0){waiters.splice(k,1);res(null)}},ms)});
}

// ---- desafio ----
async function duelPeer(o){
  const name=peerName(o);
  if(o.p.b){await say(`${name} está ocupado agora. Espere um pouquinho.`);return}
  setText(`Desafiar ${name} pra um duelo ao vivo?`);
  const i=await choose([{label:'SIM'},{label:'NÃO'}],{cls:'yesno'});
  if(i!==0)return;
  const match=Math.random().toString(36).slice(2,10),seed=Math.floor(Math.random()*2147483647),code=myCode();
  await sendMsg('desafio',{to:o.id,match,seed,name:S.name,code});
  setText(`Esperando ${name} responder...`);
  const r=await waitMsg('resposta',p=>p.match===match&&p.from===o.id,30000);
  if(!r){await say(`${name} não respondeu.`);return}
  if(!r.ok){await say(r.why==='ocupado'?`${name} está ocupado agora.`:`${name} recusou o duelo.`);return}
  const opp=decodeTeam(String(r.code||''));
  if(!opp){await say('O time do seu amigo chegou com problema. Tentem de novo.');return}
  await pvpFight({match,seed,iAmA:true,oppId:o.id,name,opp,code});
}
function onDesafio(p){
  if(!p||!me||p.to!==me.id)return;
  const name=cleanName(p.name),no=why=>sendMsg('resposta',{to:p.from,match:p.match,ok:false,why});
  if(!started||mode!=='world'||busy){no('ocupado');return}
  const opp=decodeTeam(String(p.code||''));
  if(!opp||!Number.isInteger(p.seed)){no('recusou');return}
  run(async()=>{
    setText(`${name} te desafiou pra um duelo ao vivo! Aceitar?`);
    const i=await choose([{label:'SIM'},{label:'NÃO'}],{cls:'yesno',cancel:false});
    if(i!==0){no('recusou');return}
    const code=myCode();
    await sendMsg('resposta',{to:p.from,match:p.match,ok:true,code});
    await pvpFight({match:p.match,seed:p.seed,iAmA:false,oppId:p.from,name,opp,code});
  });
}
// os dois lados usam exatamente os times dos códigos trocados, então os números batem
async function pvpFight({match,seed,iAmA,oppId,name,opp,code}){
  const mine=decodeTeam(code);
  mine.team.forEach(m=>{m.hp=maxHP(m,S)});
  await fight({team:opp.team,owner:opp.owner,name,bg:'vila',friendly:true,reward:150,pvp:{match,seed,iAmA,oppId,turn:0},mine:mine.team});
}

// ---- turnos do duelo ao vivo ----
function sanitizeAct(a){
  const e=B.team[B.ei];
  if(!a||typeof a!=='object')return{k:'move',i:0};
  if(a.k==='quit')return{k:'quit'};
  if(a.k==='sw'&&Number.isInteger(a.i)&&a.i!==B.ei&&B.team[a.i]&&B.team[a.i].hp>0)return{k:'sw',i:a.i};
  return{k:'move',i:Number.isInteger(a.i)&&a.i>=0&&a.i<e.moves.length?a.i:0};
}
async function pvpLoop(){
  while(true){
    const m=S.party[B.me];
    setText(`O que ${nameOf(m)} vai fazer?`,true);
    const a=await choose([{label:'LUTAR'},{label:'ZOOBUMONS'},{label:'DESISTIR'}],{cls:'battle',cols:2,cancel:false});
    let act;
    if(a===0){const i=await pickMove();if(i<0)continue;act={k:'move',i}}
    else if(a===1){
      const i=await pickParty('Trocar por qual zoobumon?');
      if(i<0||i===B.me)continue;
      if(S.party[i].hp<=0){await say('Esse zoobumon está desmaiado!');continue}
      act={k:'sw',i};
    }else{
      setText('Desistir do duelo?');
      if(await choose([{label:'SIM'},{label:'NÃO'}],{cls:'yesno'})!==0)continue;
      act={k:'quit'};
    }
    const t=++B.pvp.turn;
    sendMsg('acao',{to:B.pvp.oppId,match:B.pvp.match,t,act});
    setText(`Esperando ${B.name} escolher...`);
    const r=await waitMsg('acao',p=>p.match===B.pvp.match&&p.t===t&&p.from===B.pvp.oppId,120000);
    if(act.k==='quit'){await say('Você desistiu do duelo.');return'lose'}
    if(!r){await say(`${B.name} saiu do duelo. Vitória sua!`);return'win'}
    const opp=sanitizeAct(r.act);
    if(opp.k==='quit'){await say(`${B.name} desistiu do duelo!`);return'win'}
    const res=await pvpResolve(act,opp);
    if(res&&res!=='continue')return res;
  }
}
async function enemySwitch(i){
  await say(`${B.name} chamou ${nameOf(B.team[B.ei])} de volta!`);
  await tween(300,t=>{B.eX=t*140});
  B.ei=i;B.eY=0;B.eA=1;hud();
  await tween(350,t=>{B.eX=(1-t)*140});B.eX=0;
  await say(`${B.name} mandou ${nameOf(B.team[i])}!`);
}
async function pvpResolve(mine,opp){
  // ordem fixa nos dois aparelhos: lado A (quem desafiou) primeiro
  const acts=B.pvp.iAmA?[['me',mine],['en',opp]]:[['en',opp],['me',mine]];
  for(const[side,a]of acts)if(a.k==='sw'){if(side==='me')await switchTo(a.i,true);else await enemySwitch(a.i)}
  let movers=acts.filter(([,a])=>a.k==='move');
  if(movers.length===2){
    const spd=side=>side==='me'?st(S.party[B.me],'spd',S):st(B.team[B.ei],'spd',B.owner);
    const sA=spd(movers[0][0]),sB=spd(movers[1][0]),coin=brnd()<.5;
    if(sB>sA||(sA===sB&&!coin))movers=[movers[1],movers[0]];
  }
  for(const[side,a]of movers){
    const mon=side==='me'?S.party[B.me]:B.team[B.ei];
    const r=await attack(side,mon.moves[a.i]||mon.moves[0]);
    if(r)return r;
  }
  return null;
}

function startOnline(){
  if(!sb||!me||chan)return;
  chan=sb.channel('mundo',{config:{presence:{key:me.id},broadcast:{self:false}}});
  chan.on('presence',{event:'sync'},syncPeers)
    .on('broadcast',{event:'desafio'},({payload})=>onDesafio(payload))
    .on('broadcast',{event:'resposta'},({payload})=>onMsg('resposta',payload))
    .on('broadcast',{event:'acao'},({payload})=>onMsg('acao',payload))
    .subscribe(st=>{if(st==='SUBSCRIBED'){lastPres='';sendPresence()}});
  setInterval(sendPresence,350);
}
